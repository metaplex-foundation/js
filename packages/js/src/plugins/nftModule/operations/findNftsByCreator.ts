import { Commitment, PublicKey } from '@solana/web3.js';
import { MetadataV1GpaBuilder } from '../gpaBuilders';
import { Metadata, Nft, Sft } from '../models';
import { findNftsByMintListOperation } from './findNftsByMintList';
import { DisposableScope } from '@/utils';
import { Operation, OperationHandler, Program, useOperation } from '@/types';
import { Metaplex } from '@/Metaplex';

// -----------------
// Operation
// -----------------

const Key = 'FindNftsByCreatorOperation' as const;

/**
 * Finds multiple NFTs and SFTs by their creator at a given position.
 *
 * ```ts
 * // Find all by first creator.
 * const nfts = await metaplex
 *   .nfts()
 *   .findAllByCreator({ creator })
 *   .run();
 *
 * // Find all by second creator.
 * const nfts = await metaplex
 *   .nfts()
 *   .findAllByCreator({ creator, position: 2 })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findNftsByCreatorOperation =
  useOperation<FindNftsByCreatorOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindNftsByCreatorOperation = Operation<
  typeof Key,
  FindNftsByCreatorInput,
  FindNftsByCreatorOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindNftsByCreatorInput = {
  /** The address of the creator. */
  creator: PublicKey;

  /**
   * The position in which the provided creator should be located at.
   * E.g. `1` for searching the first creator, `2` for searching the
   * second creator, etc.
   *
   * @defaultValue `1`
   */
  position?: number;

  /** An optional set of programs that override the registered ones. */
  programs?: Program[];

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Outputs
 */
export type FindNftsByCreatorOutput = (Metadata | Nft | Sft)[];

/**
 * @group Operations
 * @category Handlers
 */
export const findNftsByCreatorOperationHandler: OperationHandler<FindNftsByCreatorOperation> =
  {
    handle: async (
      operation: FindNftsByCreatorOperation,
      metaplex: Metaplex,
      scope: OperationScope
    ): Promise<FindNftsByCreatorOutput> => {
      const { creator, position = 1, commitment, programs } = operation.input;

      const gpaBuilder = new MetadataV1GpaBuilder(
        metaplex,
        metaplex.programs().getTokenMetadata(programs).address
      );

      const mints = await gpaBuilder
        .selectMint()
        .whereCreator(position, creator)
        .getDataAsPublicKeys();
      scope.throwIfCanceled();

      const nfts = await metaplex
        .operations()
        .execute(
          findNftsByMintListOperation({ mints, commitment, programs }),
          scope
        );
      scope.throwIfCanceled();

      return nfts.filter((nft): nft is Metadata | Nft | Sft => nft !== null);
    },
  };
