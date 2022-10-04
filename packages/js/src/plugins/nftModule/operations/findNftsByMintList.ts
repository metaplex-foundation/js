import { Commitment, PublicKey } from '@solana/web3.js';
import { toMetadataAccount } from '../accounts';
import { Metadata, Nft, Sft, toMetadata } from '../models';
import { findMetadataPda } from '../pdas';
import { DisposableScope, GmaBuilder } from '@/utils';
import { Operation, OperationHandler, Program, useOperation } from '@/types';
import { Metaplex } from '@/Metaplex';

// -----------------
// Operation
// -----------------

const Key = 'FindNftsByMintListOperation' as const;

/**
 * Finds multiple NFTs and SFTs by a given list of mint addresses.
 *
 * ```ts
 * const nfts = await metaplex
 *   .nfts()
 *   .findAllByMintList({ mints: [...] })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findNftsByMintListOperation =
  useOperation<FindNftsByMintListOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindNftsByMintListOperation = Operation<
  typeof Key,
  FindNftsByMintListInput,
  FindNftsByMintListOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindNftsByMintListInput = {
  /** The addresses of all mint accounts we want to fetch. */
  mints: PublicKey[];

  /** An optional set of programs that override the registered ones. */
  programs?: Program[];

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Outputs
 */
export type FindNftsByMintListOutput = (Metadata | Nft | Sft | null)[];

/**
 * @group Operations
 * @category Handlers
 */
export const findNftsByMintListOperationHandler: OperationHandler<FindNftsByMintListOperation> =
  {
    handle: async (
      operation: FindNftsByMintListOperation,
      metaplex: Metaplex,
      scope: OperationScope
    ): Promise<FindNftsByMintListOutput> => {
      const { mints, commitment } = operation.input;
      const metadataPdas = mints.map((mint) => findMetadataPda(mint));
      const metadataInfos = await GmaBuilder.make(metaplex, metadataPdas, {
        commitment,
      }).get();
      scope.throwIfCanceled();

      return metadataInfos.map<Metadata | null>((account) => {
        if (!account.exists) {
          return null;
        }

        try {
          return toMetadata(toMetadataAccount(account));
        } catch (error) {
          return null;
        }
      });
    },
  };
