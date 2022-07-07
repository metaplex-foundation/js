import { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { TokenProgram } from '../tokenModule';
import { Operation, OperationHandler, useOperation } from '@/types';
import { findNftsByMintListOperation } from './findNftsByMintList';
import { LazyNft, Nft } from './Nft';
import { DisposableScope } from '@/utils';

// -----------------
// Operation
// -----------------

const Key = 'FindNftsByOwnerOperation' as const;
export const findNftsByOwnerOperation =
  useOperation<FindNftsByOwnerOperation>(Key);
export type FindNftsByOwnerOperation = Operation<
  typeof Key,
  FindNftsByOwnerInput,
  (LazyNft | Nft)[]
>;

export type FindNftsByOwnerInput = {
  owner: PublicKey;
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

export const findNftsByOwnerOperationHandler: OperationHandler<FindNftsByOwnerOperation> =
  {
    handle: async (
      operation: FindNftsByOwnerOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
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

      return nfts.filter((nft): nft is LazyNft => nft !== null);
    },
  };
