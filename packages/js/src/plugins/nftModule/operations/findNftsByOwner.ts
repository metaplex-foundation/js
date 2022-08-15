import { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { TokenProgram } from '../tokenModule';
import { Operation, OperationHandler, useOperation } from '@/types';
import { findNftsByMintListOperation } from './findNftsByMintList';
import { Nft } from './Nft';
import { DisposableScope } from '@/utils';
import { Metadata } from './Metadata';
import { Sft } from './Sft';
import type { NftClient } from './NftClient';

// -----------------
// Clients
// -----------------

/** @internal */
export function _findNftsByOwnerClient(
  this: NftClient,
  owner: PublicKey,
  options?: Omit<FindNftsByOwnerInput, 'owner'>
) {
  return this.metaplex
    .operations()
    .getTask(findNftsByOwnerOperation({ owner, ...options }));
}

// -----------------
// Operation
// -----------------

const Key = 'FindNftsByOwnerOperation' as const;
export const findNftsByOwnerOperation =
  useOperation<FindNftsByOwnerOperation>(Key);
export type FindNftsByOwnerOperation = Operation<
  typeof Key,
  FindNftsByOwnerInput,
  FindNftsByOwnerOutput
>;

export type FindNftsByOwnerInput = {
  owner: PublicKey;
  commitment?: Commitment;
};

export type FindNftsByOwnerOutput = (Metadata | Nft | Sft)[];

// -----------------
// Handler
// -----------------

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
