import { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { findNftsByCreatorOperation, LazyNft, Nft } from '../nftModule';
import { DisposableScope } from '@/utils';
import { findCandyMachineCreatorPda } from './pdas';

// -----------------
// Operation
// -----------------

const Key = 'FindMintedNftsByCandyMachineOperation' as const;
export const findMintedNftsByCandyMachineOperation =
  useOperation<FindMintedNftsByCandyMachineOperation>(Key);
export type FindMintedNftsByCandyMachineOperation = Operation<
  typeof Key,
  FindMintedNftsByCandyMachineInput,
  (LazyNft | Nft)[]
>;

export interface FindMintedNftsByCandyMachineInput {
  candyMachine: PublicKey;
  version?: 1 | 2;
  commitment?: Commitment;
}

// -----------------
// Handler
// -----------------

export const findMintedNftsByCandyMachineOperationHandler: OperationHandler<FindMintedNftsByCandyMachineOperation> =
  {
    handle: async (
      operation: FindMintedNftsByCandyMachineOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const { candyMachine, version = 2, commitment } = operation.input;
      const firstCreator =
        version === 2 ? findCandyMachineCreatorPda(candyMachine) : candyMachine;

      return metaplex.operations().execute(
        findNftsByCreatorOperation({
          creator: firstCreator,
          position: 1,
          commitment,
        }),
        scope
      );
    },
  };
