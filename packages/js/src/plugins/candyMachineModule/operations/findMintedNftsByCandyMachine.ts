import { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { findNftsByCreatorOperation, Metadata, Nft } from '../nftModule';
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
  FindMintedNftsByCandyMachineOutput
>;

export type FindMintedNftsByCandyMachineInput = {
  candyMachine: PublicKey;
  version?: 1 | 2;
  commitment?: Commitment;
};

export type FindMintedNftsByCandyMachineOutput = (Metadata | Nft)[];

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

      const mintedNfts = await metaplex.operations().execute(
        findNftsByCreatorOperation({
          creator: firstCreator,
          position: 1,
          commitment,
        }),
        scope
      );

      return mintedNfts as (Nft | Metadata)[];
    },
  };
