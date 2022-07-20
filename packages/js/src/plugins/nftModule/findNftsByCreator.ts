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

const Key = 'FindNftsByCreatorOperation' as const;
export const findNftsByCreatorOperation =
  useOperation<FindNftsByCreatorOperation>(Key);
export type FindNftsByCreatorOperation = Operation<
  typeof Key,
  FindNftsByCreatorInput,
  (LazyNft | Nft)[]
>;

export interface FindNftsByCreatorInput {
  creator: PublicKey;
  position?: number;
  commitment?: Commitment;
}

// -----------------
// Handler
// -----------------

export const findNftsByCreatorOperationHandler: OperationHandler<FindNftsByCreatorOperation> =
  {
    handle: async (
      operation: FindNftsByCreatorOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const { creator, position = 1, commitment } = operation.input;

      const mints = await TokenMetadataProgram.metadataV1Accounts(metaplex)
        .selectMint()
        .whereCreator(position, creator)
        .getDataAsPublicKeys();
      scope.throwIfCanceled();

      const nfts = await metaplex
        .operations()
        .execute(findNftsByMintListOperation({ mints, commitment }), scope);

      return nfts.filter((nft): nft is LazyNft => nft !== null);
    },
  };
