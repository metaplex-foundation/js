import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { Signer } from '@/types';
import { CandyMachineToUpdateNotFoundError } from '@/errors';
import { MetaplexFile } from '@/plugins/storageModule';
import { ConfigLine } from '@metaplex-foundation/mpl-candy-machine';
import { JsonMetadata, UploadMetadataInput } from '@/plugins/nftModule';
import type { CandyMachineClient } from './CandyMachineClient';
import {
  assertCanAdd,
  assertNotFull,
  creatorsToJsonMetadataCreators,
} from './Client.helpers';
import { randomStr } from '../../utils';

export type UploadAssetToCandyMachineParams = {
  // Accounts.
  candyMachineAddress: PublicKey;
  authoritySigner: Signer;

  // Data.
  metadata: UploadMetadataInput;

  // If `true` the successfully uploaded asset is added to the candy machine.
  addToCandyMachine?: boolean;

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

export async function uploadAssetForCandyMachine(
  this: CandyMachineClient,
  params: UploadAssetToCandyMachineParams
) {
  const {
    candyMachineAddress,
    authoritySigner,
    metadata: rawMetadata,
    addToCandyMachine = false,
    confirmOptions,
  } = params;

  const candyMachine = await this.findByAddress(candyMachineAddress);
  if (candyMachine == null) {
    throw new CandyMachineToUpdateNotFoundError(candyMachineAddress);
  }

  assertNotFull(candyMachine, candyMachine.assetsCount);

  const { uri, metadata } = await this.metaplex.nfts().uploadMetadata({
    ...rawMetadata,
    // TODO(thlorenz): Is this correct?
    seller_fee_basis_points:
      rawMetadata.seller_fee_basis_points ?? candyMachine.sellerFeeBasisPoints,
    properties: {
      ...rawMetadata.properties,
      // Default NFT creators to equal those of the Candy Machine
      creators:
        rawMetadata.properties?.creators ??
        creatorsToJsonMetadataCreators(candyMachine.creators),
    },
  });

  let addAssetsTransactionId;
  if (addToCandyMachine) {
    const { transactionId } = await this.addAssets({
      candyMachineAddress: candyMachineAddress,
      authoritySigner: authoritySigner,
      assets: [{ uri, name: metadata.name ?? randomStr() }],
      confirmOptions,
    });
    addAssetsTransactionId = transactionId;
  }

  return {
    metadata,
    uri,
    addAssetsTransactionId,
  };
}

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
  const {
    candyMachineAddress,
    assets,
    parallel = false,
    addToCandyMachine = false,
  } = params;

  const candyMachine = await this.findByAddress(candyMachineAddress);
  if (candyMachine == null) {
    throw new CandyMachineToUpdateNotFoundError(candyMachineAddress);
  }

  assertNotFull(candyMachine, candyMachine.assetsCount);
  assertCanAdd(candyMachine, candyMachine.assetsCount, assets.length);

  // TODO(thlorenz): prevent same asset from being uploaded twice, remove once
  // API improves to have clearly separated properties
  const uploadParams = assets.map(
    (file: MetaplexFile): UploadAssetToCandyMachineParams => ({
      ...params,
      metadata: {
        image: file,
        name: file.displayName,
      },
      // We add them all in one transaction after all assets are uploaded
      addToCandyMachine: false,
    })
  );

  let uploadedAssets: UploadedAsset[] = [];
  const errors = [];

  if (parallel) {
    // NOTE: we are uploading in parallel here but if only one upload was to fail
    // all the other ones still happen as we cannot cancel promises
    const promises = uploadParams.map(async (assetParam) => {
      let uploaded;
      let err;
      try {
        uploaded = await _uploadAssetAndSelectName(this, assetParam);
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
        uploadedAssets.push(await _uploadAssetAndSelectName(this, assetParam));
      } catch (err) {
        errors.push(err);
        continue;
      }
    }
  }

  let addAssetsTransactionId;
  let updatedCandyMachine = candyMachine;
  if (addToCandyMachine && uploadedAssets.length > 0) {
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
    errors,
  };
}

async function _uploadAssetAndSelectName(
  candyMachine: CandyMachineClient,
  params: UploadAssetToCandyMachineParams
): Promise<UploadedAsset> {
  const { uri, metadata: parseMetadata } =
    await candyMachine.uploadAssetForCandyMachine(params);

  return {
    uri,
    metadata: parseMetadata,
    name: parseMetadata.name ?? randomStr(),
  };
}
