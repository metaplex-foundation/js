import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope } from '@/utils';
import { Commitment, PublicKey } from '@solana/web3.js';
import { toMetadataAccount } from '../accounts';
import { Nft, NftWithToken, Sft, SftWithToken } from '../models';

// -----------------
// Operation
// -----------------

const Key = 'FindNftByMetadataOperation' as const;

/**
 * Finds an NFT or an SFT by its metadata address.
 *
 * ```ts
 * const nft = await metaplex
 *   .nfts()
 *   .findByMetadata({ metadata })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findNftByMetadataOperation =
  useOperation<FindNftByMetadataOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindNftByMetadataOperation = Operation<
  typeof Key,
  FindNftByMetadataInput,
  FindNftByMetadataOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindNftByMetadataInput = {
  /** The address of the metadata account. */
  metadata: PublicKey;

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
export type FindNftByMetadataOutput = Nft | Sft | NftWithToken | SftWithToken;

/**
 * @group Operations
 * @category Handlers
 */
export const findNftByMetadataOperationHandler: OperationHandler<FindNftByMetadataOperation> =
  {
    handle: async (
      operation: FindNftByMetadataOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<FindNftByMetadataOutput> => {
      const metadata = toMetadataAccount(
        await metaplex.rpc().getAccount(operation.input.metadata)
      );
      scope.throwIfCanceled();

      return metaplex
        .nfts()
        .findByMint({
          ...operation.input,
          mintAddress: metadata.data.mint,
        })
        .run(scope);
    },
  };
