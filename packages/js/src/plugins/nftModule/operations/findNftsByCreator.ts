import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope } from '@/utils';
import { Commitment, PublicKey } from '@solana/web3.js';
import { Metadata, Nft, Sft } from '../models';
import type { NftClient } from '../NftClient';
import { TokenMetadataProgram } from '../program';
import { findNftsByMintListOperation } from './findNftsByMintList';

// -----------------
// Clients
// -----------------

/** @internal */
export function _findNftsByCreatorsClient(
  this: NftClient,
  creator: PublicKey,
  options?: Omit<FindNftsByCreatorInput, 'creator'>
) {
  return this.metaplex
    .operations()
    .getTask(findNftsByCreatorOperation({ creator, ...options }));
}

// -----------------
// Operation
// -----------------

const Key = 'FindNftsByCreatorOperation' as const;
export const findNftsByCreatorOperation =
  useOperation<FindNftsByCreatorOperation>(Key);
export type FindNftsByCreatorOperation = Operation<
  typeof Key,
  FindNftsByCreatorInput,
  FindNftsByCreatorOutput
>;

export type FindNftsByCreatorInput = {
  creator: PublicKey;
  position?: number;
  commitment?: Commitment;
};

export type FindNftsByCreatorOutput = (Metadata | Nft | Sft)[];

// -----------------
// Handler
// -----------------

export const findNftsByCreatorOperationHandler: OperationHandler<FindNftsByCreatorOperation> =
  {
    handle: async (
      operation: FindNftsByCreatorOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<FindNftsByCreatorOutput> => {
      const { creator, position = 1, commitment } = operation.input;

      const mints = await TokenMetadataProgram.metadataV1Accounts(metaplex)
        .selectMint()
        .whereCreator(position, creator)
        .getDataAsPublicKeys();
      scope.throwIfCanceled();

      const nfts = await metaplex
        .operations()
        .execute(findNftsByMintListOperation({ mints, commitment }), scope);
      scope.throwIfCanceled();

      return nfts.filter((nft): nft is Metadata | Nft | Sft => nft !== null);
    },
  };
