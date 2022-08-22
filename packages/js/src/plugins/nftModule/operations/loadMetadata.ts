import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope } from '@/utils';
import { Commitment, PublicKey } from '@solana/web3.js';
import { Metadata, Nft, NftWithToken, Sft, SftWithToken } from '../models';

// -----------------
// Operation
// -----------------

const Key = 'LoadMetadataOperation' as const;

/**
 * Transforms a `Metadata` model into a `Nft` or `Sft` model.
 *
 * ```ts
 * const nfts = await metaplex
 *   .nfts()
 *   .load({ metadata })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const loadMetadataOperation = useOperation<LoadMetadataOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type LoadMetadataOperation = Operation<
  typeof Key,
  LoadMetadataInput,
  LoadMetadataOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type LoadMetadataInput = {
  /** The address of the metadata account. */
  metadata: Metadata;

  /**
   * The explicit token account to fetch with the NFT or SFT.
   *
   * If provided, and if that address is valid, the NFT or SFT returned
   * will be of the type `NftWithToken` or `SftWithToken` respectively.
   *
   * Alternatively, you may use the `tokenOwner` parameter to fetch the
   * associated token account.
   *
   * @defaultValue Defaults to not fetching the token account.
   */
  tokenAddress?: PublicKey;

  /**
   * The associated token account to fetch with the NFT or SFT.
   *
   * If provided, and if that account exists, the NFT or SFT returned
   * will be of the type `NftWithToken` or `SftWithToken` respectively.
   *
   * Alternatively, you may use the `tokenAddress` parameter to fetch the
   * token account at an explicit address.
   *
   * @defaultValue Defaults to not fetching the associated token account.
   */
  tokenOwner?: PublicKey;

  /**
   * Whether or not we should fetch the JSON Metadata for the NFT or SFT.
   *
   * @defaultValue `true`
   */
  loadJsonMetadata?: boolean;

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Outputs
 */
export type LoadMetadataOutput = Nft | Sft | NftWithToken | SftWithToken;

/**
 * @group Operations
 * @category Handlers
 */
export const loadMetadataOperationHandler: OperationHandler<LoadMetadataOperation> =
  {
    handle: async (
      operation: LoadMetadataOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<LoadMetadataOutput> => {
      const { metadata, loadJsonMetadata = true } = operation.input;

      let nftOrSft = await metaplex
        .nfts()
        .findByMint({
          ...operation.input,
          mintAddress: metadata.mintAddress,
          loadJsonMetadata: !metadata.jsonLoaded && loadJsonMetadata,
        })
        .run(scope);

      if (!nftOrSft.jsonLoaded && metadata.jsonLoaded) {
        nftOrSft = { ...nftOrSft, json: metadata.json, jsonLoaded: true };
      }

      return nftOrSft;
    },
  };
