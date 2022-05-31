import { PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { findNftsByCreatorOperation } from './findNftsByCreator';
import { Nft } from './Nft';

const Key = 'FindNftsByCandyMachineOperation' as const;
export const findNftsByCandyMachineOperation =
  useOperation<FindNftsByCandyMachineOperation>(Key);
export type FindNftsByCandyMachineOperation = Operation<
  typeof Key,
  FindNftsByCandyMachineInput,
  Nft[]
>;

export interface FindNftsByCandyMachineInput {
  candyMachine: PublicKey;
  version?: 1 | 2;
}

export const findNftsByCandyMachineOnChainOperationHandler: OperationHandler<FindNftsByCandyMachineOperation> =
  {
    handle: async (
      operation: FindNftsByCandyMachineOperation,
      metaplex: Metaplex
    ): Promise<Nft[]> => {
      const { candyMachine, version = 2 } = operation.input;
      let firstCreator = candyMachine;

      if (version === 2) {
        // TODO: Refactor when we have a CandyMachine program in the SDK.
        [firstCreator] = PublicKey.findProgramAddressSync(
          [Buffer.from('candy_machine'), candyMachine.toBuffer()],
          new PublicKey('cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ')
        );
      }

      return metaplex.operations().execute(
        findNftsByCreatorOperation({
          creator: firstCreator,
          position: 1,
        })
      );
    },
  };
