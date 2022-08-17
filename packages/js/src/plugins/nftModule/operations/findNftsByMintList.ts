import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope, GmaBuilder } from '@/utils';
import { Commitment, PublicKey } from '@solana/web3.js';
import { toMetadataAccount } from '../accounts';
import { Metadata, Nft, Sft, toMetadata } from '../models';
import { findMetadataPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'FindNftsByMintListOperation' as const;

/**
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
  mints: PublicKey[];
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
      scope: DisposableScope
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
