import { Commitment, PublicKey } from '@solana/web3.js';
import { Operation, OperationHandler, useOperation } from '@/types';
import { Metaplex } from '@/Metaplex';
import { TokenMetadataProgram } from './program';
import { findNftsByMintListOperation } from './findNftsByMintList';
import { Nft } from './Nft';
import { DisposableScope } from '@/utils';
import { Metadata } from './Metadata';
import { Sft } from './Sft';

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
