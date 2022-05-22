import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { Signer, MetaplexFile } from '@/types';
import { CandyMachineToUpdateNotFoundError } from '@/errors';
import { ConfigLine, Creator } from '@metaplex-foundation/mpl-candy-machine';
import {
  JsonMetadata,
  JsonMetadataFile,
  UploadMetadataInput,
} from '@/plugins/nftModule';
import { CandyMachineClient } from './CandyMachineClient';
import {
  assertCanAdd,
  assertNotFull,
  creatorsToJsonMetadataCreators,
} from './Client.helpers';
import { randomStr } from '../../utils';

// -----------------
// uploadAssetForCandyMachine (single)
// -----------------
export type UploadAssetProperties = {
  creators?: Creator[];
  files?: JsonMetadataFile<MetaplexFile | string>[];
  [key: string]: unknown;
};

export type UploadAssetToCandyMachineParams = UploadMetadataInput & {
  // Accounts
  candyMachineAddress: PublicKey;
  authoritySigner: Signer;

  // Asset
  properties?: UploadAssetProperties;

  // If `true` the successfully uploaded asset is added to the candy machine
  addToCandyMachine?: boolean;

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

export async function uploadAssetForCandyMachine(
  this: CandyMachineClient,
  params: UploadAssetToCandyMachineParams
) {
  const candyMachine = await this.findByAddress(params.candyMachineAddress);
  if (candyMachine == null) {
    throw new CandyMachineToUpdateNotFoundError(params.candyMachineAddress);
  }

  assertNotFull(candyMachine, candyMachine.assetsCount);

  // Default NFT creators to equal those of the Candy Machine
  const creators = params.properties?.creators ?? candyMachine.creators;
  const uploadProperties = {
    ...params.properties,
    creators: creatorsToJsonMetadataCreators(creators),
  };
  // TODO(thlorenz): Is this correct?
  const seller_fee_basis_points =
    params.seller_fee_basis_points ?? candyMachine.sellerFeeBasisPoints;

  const {
    candyMachineAddress,
    authoritySigner,
    properties,
    ...uploadInputParams
  } = params;

  const uploadInput: UploadMetadataInput = {
    ...uploadInputParams,
    properties: uploadProperties,
    seller_fee_basis_points,
  };

  const { uri, metadata } = await this.metaplex
    .nfts()
    .uploadMetadata(uploadInput);

  let addAssetsTransactionId;
  if (params.addToCandyMachine) {
    const assetName = selectAssetName(metadata, params);
    const { transactionId } = await this.addAssets({
      candyMachineAddress: params.candyMachineAddress,
      authoritySigner: params.authoritySigner,
      assets: [{ uri, name: assetName }],
      confirmOptions: params.confirmOptions,
    });
    addAssetsTransactionId = transactionId;
  }

  return {
    metadata,
    uri,
    addAssetsTransactionId,
  };
}

// -----------------
// uploadAssetsForCandyMachine (multiple)
// -----------------

// NOTE: the `[key: string]: unknown;` that is part of `UploadMetadataInput` breaks type safety once
// we extend a derived type, thus we don't get intellisense for `CandyMachineAsset` either
export type CandyMachineAsset = Omit<
  UploadAssetToCandyMachineParams,
  'candyMachineAddress' | 'authoritySigner'
>;

export type UploadAssetsToCandyMachineParams = {
  // Accounts
  candyMachineAddress: PublicKey;
  authoritySigner: Signer;

  // Assets
  assets: MetaplexFile[];

  // If `true` then the assets are uploaded in parallel, however note that this
  // can result in some successfully uploading while others fail
  parallel?: boolean;

  // If `true` all successfully uploaded assets are added to the candy machine
  addToCandyMachine?: boolean;

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

export type UploadedAsset = {
  uri: string;
  metadata: JsonMetadata<string>;
  name: string;
};

export async function uploadAssetsForCandyMachine(
  this: CandyMachineClient,
  params: UploadAssetsToCandyMachineParams
) {
  const candyMachine = await this.findByAddress(params.candyMachineAddress);
  if (candyMachine == null) {
    throw new CandyMachineToUpdateNotFoundError(params.candyMachineAddress);
  }

  assertNotFull(candyMachine, candyMachine.assetsCount);
  assertCanAdd(candyMachine, candyMachine.assetsCount, params.assets.length);

  const { parallel = false, addToCandyMachine = false } = params;

  const uploadParams = params.assets.map((x) => {
    const param: UploadAssetToCandyMachineParams = {
      ...params,
      image: x,
      name: x.displayName,
      // We add them all in one transaction after all assets are uploaded
      addToCandyMachine: false,
    };
    return param;
  });
  let uploadedAssets: UploadedAsset[] = [];
  const errors = [];

  if (parallel) {
    // NOTE: we are uploading in parallel here but if only one upload was to fail
    // all the other ones still happen as we cannot cancel promises
    const promises = uploadParams.map(async (assetParam) => {
      let uploaded;
      let err;
      try {
        uploaded = await _uploadAssetAndSelectName(this, params, assetParam);
      } catch (e) {
        errors.push(e);
      }

      return { uploaded, err };
    });

    const results = await Promise.all(promises);
    for (const { err, uploaded } of results) {
      if (err) {
        errors.push(err);
      } else {
        uploadedAssets.push(uploaded as UploadedAsset);
      }
    }
  } else {
    for (const assetParam of uploadParams) {
      try {
        uploadedAssets.push(
          await _uploadAssetAndSelectName(this, params, assetParam)
        );
      } catch (err) {
        errors.push(err);
        continue;
      }
    }
  }

  let addAssetsTransactionId;
  let updatedCandyMachine = candyMachine;
  if (addToCandyMachine) {
    const configLines: ConfigLine[] = uploadedAssets.map((x) => ({
      uri: x.uri,
      name: x.name,
    }));

    const { transactionId, candyMachine } = await this.addAssets({
      ...params,
      assets: configLines,
    });
    addAssetsTransactionId = transactionId;
    if (candyMachine != null) {
      updatedCandyMachine = candyMachine;
    }
  }

  return {
    addAssetsTransactionId,
    uploadedAssets,
    candyMachine: updatedCandyMachine,
  };
}

async function _uploadAssetAndSelectName(
  candyMachine: CandyMachineClient,
  params: UploadAssetsToCandyMachineParams,
  asset: CandyMachineAsset
) {
  const { uri, metadata } = await candyMachine.uploadAssetForCandyMachine({
    ...params,
    ...asset,
  });
  return {
    uri,
    metadata,
    name: selectAssetName(metadata, asset),
  };
}

function selectAssetName(
  metadata: JsonMetadata<string>,
  asset: CandyMachineAsset
): string {
  return (
    metadata.name ?? (typeof asset.name === 'string' ? asset.name : randomStr())
  );
}
