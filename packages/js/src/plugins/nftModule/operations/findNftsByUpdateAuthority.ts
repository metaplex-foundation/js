import { Commitment, PublicKey } from '@solana/web3.js';
import { Operation, OperationHandler, useOperation } from '@/types';
import { Metaplex } from '@/Metaplex';
import { TokenMetadataProgram } from './program';
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
export function _findNftsByUpdateAuthorityClient(
  this: NftClient,
  updateAuthority: PublicKey,
  options?: Omit<FindNftsByUpdateAuthorityInput, 'updateAuthority'>
) {
  return this.metaplex
    .operations()
    .getTask(
      findNftsByUpdateAuthorityOperation({ updateAuthority, ...options })
    );
}

// -----------------
// Operation
// -----------------

const Key = 'FindNftsByUpdateAuthorityOperation' as const;
export const findNftsByUpdateAuthorityOperation =
  useOperation<FindNftsByUpdateAuthorityOperation>(Key);
export type FindNftsByUpdateAuthorityOperation = Operation<
  typeof Key,
  FindNftsByUpdateAuthorityInput,
  FindNftsByUpdateAuthorityOutput
>;

export interface FindNftsByUpdateAuthorityInput {
  updateAuthority: PublicKey;
  commitment?: Commitment;
}

export type FindNftsByUpdateAuthorityOutput = (Metadata | Nft | Sft)[];

// -----------------
// Handler
// -----------------

export const findNftsByUpdateAuthorityOperationHandler: OperationHandler<FindNftsByUpdateAuthorityOperation> =
  {
    handle: async (
      operation: FindNftsByUpdateAuthorityOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<FindNftsByUpdateAuthorityOutput> => {
      const { updateAuthority, commitment } = operation.input;

      const mints = await TokenMetadataProgram.metadataV1Accounts(metaplex)
        .selectMint()
        .whereUpdateAuthority(updateAuthority)
        .getDataAsPublicKeys();
      scope.throwIfCanceled();

      const nfts = await metaplex
        .operations()
        .execute(findNftsByMintListOperation({ mints, commitment }), scope);
      scope.throwIfCanceled();

      return nfts.filter((nft): nft is Metadata | Nft | Sft => nft !== null);
    },
  };
