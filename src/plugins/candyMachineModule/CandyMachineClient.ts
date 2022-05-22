import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { ModuleClient, Signer, MetaplexFile } from '@/types';
import {
  CandyMachineCannotAddAmountError,
  CandyMachineIsFullError,
  CandyMachineToUpdateNotFoundError,
  UpdatedCandyMachineNotFoundError,
} from '@/errors';
import { CandyMachine } from './CandyMachine';
import { ConfigLine, Creator } from '@metaplex-foundation/mpl-candy-machine';
import {
  JsonMetadata,
  JsonMetadataFile,
  UploadMetadataInput,
} from '@/plugins/nftModule';
import { AddConfigLinesInput, addConfigLinesOperation } from './addConfigLines';
import {
  findAllByAuthority,
  findAllByWallet,
  findByAddress,
  findByAuthorityAndUuid,
} from './Client.queries';
import { create, createFromConfig } from './Client.create';
import { update, updateAuthority } from './Client.update';

export type AddAssetsToCandyMachineParams = {
  // Accounts
  candyMachineAddress: PublicKey;
  authoritySigner: Signer;

  // Args
  assets: ConfigLine[];

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};
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

  // TODO(thlorenz):
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

export class CandyMachineClient extends ModuleClient {
  // -----------------
  // Queries
  // -----------------
  findByAddress = findByAddress;
  findAllByWallet = findAllByWallet;
  findAllByAuthority = findAllByAuthority;
  findByAuthorityAndUuid = findByAuthorityAndUuid;

  // -----------------
  // Create
  // -----------------
  create = create;
  createFromConfig = createFromConfig;

  // -----------------
  // Update
  // -----------------
  update = update;
  updateAuthority = updateAuthority;

  // -----------------
  // Add and Upload Assets
  // -----------------
  async addAssets(params: AddAssetsToCandyMachineParams) {
    const currentCandyMachine = await this.findByAddress(
      params.candyMachineAddress
    );
    if (currentCandyMachine == null) {
      throw new CandyMachineToUpdateNotFoundError(params.candyMachineAddress);
    }

    const index = currentCandyMachine.assetsCount;

    assertNotFull(currentCandyMachine, index);
    assertCanAdd(currentCandyMachine, index, params.assets.length);

    const addConfigLinesInput: AddConfigLinesInput = {
      candyMachineAddress: params.candyMachineAddress,
      authoritySigner: params.authoritySigner,
      index,
      configLines: params.assets,
    };

    const addConfigLinesOutput = await this.metaplex
      .operations()
      .execute(addConfigLinesOperation(addConfigLinesInput));

    const candyMachine = await this.findByAddress(params.candyMachineAddress);
    if (currentCandyMachine == null) {
      throw new UpdatedCandyMachineNotFoundError(params.candyMachineAddress);
    }

    return {
      candyMachine,
      ...addConfigLinesOutput,
    };
  }

  async uploadAssetForCandyMachine(params: UploadAssetToCandyMachineParams) {
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

    return {
      candyMachine,
      metadata,
      uri,
    };
  }

  async uploadAssetsForCandyMachine(params: UploadAssetsToCandyMachineParams) {
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
          uploaded = await this._uploadAssetAndSelectName(params, asset);
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
            await this._uploadAssetAndSelectName(params, asset)
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

  private async _uploadAssetAndSelectName(
    params: UploadAssetsToCandyMachineParams,
    asset: CandyMachineAsset
  ) {
    const { uri, metadata } = await this.uploadAssetForCandyMachine({
      ...params,
      ...asset,
    });
    return {
      uri,
      metadata,
      name:
        metadata.name ??
        (typeof asset.name === 'string' ? asset.name : undefined) ??
        metadata.description ??
        uri,
    };
  }
}

// -----------------
// Helpers
// -----------------
function creatorsToJsonMetadataCreators(creators: Creator[]) {
  return creators.map((creator: Creator) => ({
    address: creator.address.toBase58(),
    share: creator.share,
    verified: creator.verified,
  }));
}

function assertNotFull(candyMachine: CandyMachine, index: number) {
  if (candyMachine.isFull) {
    throw new CandyMachineIsFullError(index, candyMachine.maxSupply);
  }
}

function assertCanAdd(
  candyMachine: CandyMachine,
  index: number,
  amount: number
) {
  if (index + amount > candyMachine.maxSupply) {
    throw new CandyMachineCannotAddAmountError(
      index,
      amount,
      candyMachine.maxSupply
    );
  }
}
