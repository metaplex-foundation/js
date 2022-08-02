import { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { toMetadataAccount } from './accounts';
import { findMetadataPda } from './pdas';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope, GmaBuilder } from '@/utils';
import { Nft } from './Nft';
import { Metadata, toMetadata } from './Metadata';
import { Sft } from './Sft';
import type { NftClient } from './NftClient';

// -----------------
// Clients
// -----------------

/** @internal */
export function _findNftsByMintListClient(
  this: NftClient,
  mints: PublicKey[],
  options?: Omit<FindNftsByMintListInput, 'mints'>
) {
  return this.metaplex
    .operations()
    .getTask(findNftsByMintListOperation({ mints, ...options }));
}

// -----------------
// Operation
// -----------------

const Key = 'FindNftsByMintListOperation' as const;
export const findNftsByMintListOperation =
  useOperation<FindNftsByMintListOperation>(Key);
export type FindNftsByMintListOperation = Operation<
  typeof Key,
  FindNftsByMintListInput,
  FindNftsByMintListOutput
>;

export type FindNftsByMintListInput = {
  mints: PublicKey[];
  commitment?: Commitment;
};

export type FindNftsByMintListOutput = (Metadata | Nft | Sft | null)[];

// -----------------
// Handler
// -----------------

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
