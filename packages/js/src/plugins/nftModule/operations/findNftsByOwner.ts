import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope } from '@/utils';
import { Commitment, PublicKey } from '@solana/web3.js';
import { TokenProgram } from '../../tokenModule';
import { Metadata, Nft, Sft } from '../models';
import { findNftsByMintListOperation } from './findNftsByMintList';

// -----------------
// Operation
// -----------------

const Key = 'FindNftsByOwnerOperation' as const;

/**
 * Finds multiple NFTs and SFTs by a given owner.
 *
 * ```ts
 * const nfts = await metaplex
 *   .nfts()
 *   .findAllByOwner({ owner })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findNftsByOwnerOperation =
  useOperation<FindNftsByOwnerOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindNftsByOwnerOperation = Operation<
  typeof Key,
  FindNftsByOwnerInput,
  FindNftsByOwnerOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindNftsByOwnerInput = {
  /** The address of the owner. */
  owner: PublicKey;

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Outputs
 */
export type FindNftsByOwnerOutput = (Metadata | Nft | Sft)[];

/**
 * @group Operations
 * @category Handlers
 */
export const findNftsByOwnerOperationHandler: OperationHandler<FindNftsByOwnerOperation> =
  {
    handle: async (
      operation: FindNftsByOwnerOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<FindNftsByOwnerOutput> => {
      const { owner, commitment } = operation.input;

      const mints = await TokenProgram.tokenAccounts(metaplex)
        .selectMint()
        .whereOwner(owner)
        .whereAmount(1)
        .getDataAsPublicKeys();
      scope.throwIfCanceled();

      const nfts = await metaplex
        .operations()
        .execute(findNftsByMintListOperation({ mints, commitment }), scope);
      scope.throwIfCanceled();

      return nfts.filter((nft): nft is Metadata | Nft | Sft => nft !== null);
    },
  };
