import { Commitment, PublicKey } from '@solana/web3.js';
import { Operation, OperationHandler, useOperation } from '@/types';
import { Metaplex } from '@/Metaplex';
import { TokenMetadataProgram } from './program';
import { findNftsByMintListOperation } from './findNftsByMintList';
import { LazyNft, Nft } from './Nft';
import { DisposableScope } from '@/utils';

// -----------------
// Operation
// -----------------

const Key = 'FindNftsByUpdateAuthorityOperation' as const;
export const findNftsByUpdateAuthorityOperation =
  useOperation<FindNftsByUpdateAuthorityOperation>(Key);
export type FindNftsByUpdateAuthorityOperation = Operation<
  typeof Key,
  FindNftsByUpdateAuthorityInput,
  (LazyNft | Nft)[]
>;

export interface FindNftsByUpdateAuthorityInput {
  updateAuthority: PublicKey;
  commitment?: Commitment;
}

// -----------------
// Handler
// -----------------

export const findNftsByUpdateAuthorityOperationHandler: OperationHandler<FindNftsByUpdateAuthorityOperation> =
  {
    handle: async (
      operation: FindNftsByUpdateAuthorityOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const { updateAuthority, commitment } = operation.input;

      const mints = await TokenMetadataProgram.metadataV1Accounts(metaplex)
        .selectMint()
        .whereUpdateAuthority(updateAuthority)
        .getDataAsPublicKeys();
      scope.throwIfCanceled();

      const nfts = await metaplex
        .operations()
        .execute(findNftsByMintListOperation({ mints, commitment }), scope);

      return nfts.filter((nft): nft is LazyNft => nft !== null);
    },
  };
