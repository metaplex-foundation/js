import { PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { OperationHandler } from '@/shared';
import { Nft } from '../models';
import { FindNftsByCandyMachineOperation, findNftsByCreatorOperation } from '../operations';

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
        [firstCreator] = await PublicKey.findProgramAddress(
          [Buffer.from('candy_machine'), candyMachine.toBuffer()],
          new PublicKey('cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ')
        );
      }

      return metaplex.execute(
        findNftsByCreatorOperation({
          creator: firstCreator,
          position: 1,
        })
      );
    },
  };
