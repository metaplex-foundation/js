import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope } from '@/utils';
import { Commitment, PublicKey } from '@solana/web3.js';
import { toTokenAccount } from '../../tokenModule';
import { NftWithToken, SftWithToken } from '../models';

// -----------------
// Operation
// -----------------

const Key = 'FindNftByTokenOperation' as const;

/**
 * Finds an NFT or an SFT by its token address.
 *
 * ```ts
 * const nft = await metaplex
 *   .nfts()
 *   .findByToken({ token })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findNftByTokenOperation =
  useOperation<FindNftByTokenOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindNftByTokenOperation = Operation<
  typeof Key,
  FindNftByTokenInput,
  FindNftByTokenOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindNftByTokenInput = {
  /** The address of the token account. */
  token: PublicKey;

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
export type FindNftByTokenOutput = NftWithToken | SftWithToken;

/**
 * @group Operations
 * @category Handlers
 */
export const findNftByTokenOperationHandler: OperationHandler<FindNftByTokenOperation> =
  {
    handle: async (
      operation: FindNftByTokenOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<FindNftByTokenOutput> => {
      const token = toTokenAccount(
        await metaplex.rpc().getAccount(operation.input.token)
      );
      scope.throwIfCanceled();

      const asset = await metaplex
        .nfts()
        .findByMint({
          ...operation.input,
          mintAddress: token.data.mint,
          tokenAddress: operation.input.token,
        })
        .run(scope);

      return asset as FindNftByTokenOutput;
    },
  };
