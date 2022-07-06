import { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { findNftsByCreatorOperation } from './findNftsByCreator';
import { LazyNft } from './Nft';
import { DisposableScope } from '@/utils';

// -----------------
// Operation
// -----------------

const Key = 'FindNftsByCandyMachineOperation' as const;
export const findNftsByCandyMachineOperation =
  useOperation<FindNftsByCandyMachineOperation>(Key);
export type FindNftsByCandyMachineOperation = Operation<
  typeof Key,
  FindNftsByCandyMachineInput,
  LazyNft[]
>;

export interface FindNftsByCandyMachineInput {
  candyMachine: PublicKey;
  version?: 1 | 2;
  commitment?: Commitment;
}

// -----------------
// Handler
// -----------------

export const findNftsByCandyMachineOnChainOperationHandler: OperationHandler<FindNftsByCandyMachineOperation> =
  {
    handle: async (
      operation: FindNftsByCandyMachineOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const { candyMachine, version = 2, commitment } = operation.input;
      let firstCreator = candyMachine;

      if (version === 2) {
        // TODO(loris): Refactor when we have a CandyMachine program in the SDK.
        [firstCreator] = PublicKey.findProgramAddressSync(
          [Buffer.from('candy_machine'), candyMachine.toBuffer()],
          new PublicKey('cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ')
        );
      }

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
