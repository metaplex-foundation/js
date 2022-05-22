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

export type UploadAssetToCandyMachineParams = UploadMetadataInput & {
  // Accounts
  candyMachineAddress: PublicKey;
  authoritySigner: Signer;

  // Asset
  properties?: {
    creators?: Creator[];
    files?: JsonMetadataFile<MetaplexFile | string>[];
    [key: string]: unknown;
  };

  // If `true` the successfully uploaded asset is added to the candy machine
  addToCandyMachine?: boolean;

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

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
  assets: CandyMachineAsset[];

  // If `true` then the assets are uploaded in parallel, however note that this
  // can result in some successfully uploading while others fail
  parallel?: boolean;

  // If `true` all successfully uploaded assets are added to the candy machine
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
    const assetName = selectAssetName(metadata, params, uri);
    const { transactionId } = await this.addAssets({
      candyMachineAddress: params.candyMachineAddress,
      authoritySigner: params.authoritySigner,
      assets: [{ uri, name: assetName }],
      confirmOptions: params.confirmOptions,
    });
    addAssetsTransactionId = transactionId;
  }

  return {
    candyMachine,
    metadata,
    uri,
    addAssetsTransactionId,
  };
}

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

  type UploadedAsset = {
    uri: string;
    metadata: JsonMetadata<string>;
    name: string;
  };
  let uploadedAssets: UploadedAsset[] = [];
  const errors = [];

  if (parallel) {
    // NOTE: we are uploading in parallel here but if only one upload was to fail
    // all the other ones still happen as we cannot cancel promises
    const promises = params.assets.map(async (asset) => {
      let uploaded;
      let err;
      try {
        uploaded = await _uploadAssetAndSelectName(this, params, asset);
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
    for (const asset of params.assets) {
      try {
        uploadedAssets.push(
          await _uploadAssetAndSelectName(this, params, asset)
        );
      } catch (err) {
        errors.push(err);
        continue;
      }
    }
  }
  const configLines: ConfigLine[] = uploadedAssets.map((x) => ({
    uri: x.uri,
    name: x.name,
  }));

  const {
    transactionId,
    candyMachine: updatedCandyMachine,
    confirmResponse,
  } = await this.addAssets({
    ...params,
    assets: configLines,
  });

  return {
    addToCandyMachine,
    transactionId,
    candyMachine: updatedCandyMachine,
    confirmResponse,
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
    name: selectAssetName(metadata, asset, uri),
  };
}

function selectAssetName(
  metadata: JsonMetadata<string>,
  asset: CandyMachineAsset,
  uri: string
) {
  return (
    metadata.name ??
    (typeof asset.name === 'string' ? asset.name : undefined) ??
    randomStr()
  );
}
