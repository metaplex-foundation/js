import { PublicKey } from '@solana/web3.js';
import { OperationHandler } from '../../../shared/index.js';
import { Nft } from '../models/index.js';
import { FindNftsByCandyMachineOperation, FindNftsByCreatorOperation } from '../operations/index.js';

export class FindNftsByCandyMachineOnChainOperationHandler extends OperationHandler<FindNftsByCandyMachineOperation> {
  public async handle(operation: FindNftsByCandyMachineOperation): Promise<Nft[]> {
    const { candyMachine, version = 2 } = operation.input;
    let firstCreator = candyMachine;

    if (version === 2) {
      // TODO: Refactor when we have a CandyMachine program in the SDK.
      [firstCreator] = await PublicKey.findProgramAddress(
        [Buffer.from('candy_machine'), candyMachine.toBuffer()],
        new PublicKey('cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ')
      );
    }

    return this.metaplex.execute(
      new FindNftsByCreatorOperation({
        creator: firstCreator,
        position: 1,
      })
    );
  }
}
