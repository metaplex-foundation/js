import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Program, useOperation } from '@/types';
import { DisposableScope } from '@/utils';
import { Commitment, PublicKey } from '@solana/web3.js';
import { MetadataV1GpaBuilder } from '../gpaBuilders';
import { Metadata, Nft, Sft } from '../models';
import { findNftsByMintListOperation } from './findNftsByMintList';

// -----------------
// Operation
// -----------------

const Key = 'FindNftsByUpdateAuthorityOperation' as const;

/**
 * Finds multiple NFTs and SFTs by a given update authority.
 *
 * ```ts
 * const nfts = await metaplex
 *   .nfts()
 *   .findAllByUpdateAuthority({ updateAuthority })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findNftsByUpdateAuthorityOperation =
  useOperation<FindNftsByUpdateAuthorityOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindNftsByUpdateAuthorityOperation = Operation<
  typeof Key,
  FindNftsByUpdateAuthorityInput,
  FindNftsByUpdateAuthorityOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindNftsByUpdateAuthorityInput = {
  /** The address of the update authority. */
  updateAuthority: PublicKey;

  /** An optional set of programs that override the registered ones. */
  programs?: Program[];

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Outputs
 */
export type FindNftsByUpdateAuthorityOutput = (Metadata | Nft | Sft)[];

/**
 * @group Operations
 * @category Handlers
 */
export const findNftsByUpdateAuthorityOperationHandler: OperationHandler<FindNftsByUpdateAuthorityOperation> =
  {
    handle: async (
      operation: FindNftsByUpdateAuthorityOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<FindNftsByUpdateAuthorityOutput> => {
      const { updateAuthority, commitment, programs } = operation.input;

      const gpaBuilder = new MetadataV1GpaBuilder(
        metaplex,
        metaplex.programs().getTokenMetadata(programs).address
      );

      const mints = await gpaBuilder
        .selectMint()
        .whereUpdateAuthority(updateAuthority)
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
