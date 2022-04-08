import { PublicKey } from '@solana/web3.js';
import { OperationHandler } from '@/shared';
import { Nft } from '../models';
import { FindNftsByCandyMachineOperation, FindNftsByCreatorOperation } from '../operations';

export class FindNftsByCandyMachineOnChainOperationHandler extends OperationHandler<FindNftsByCandyMachineOperation> {
  public async handle(operation: FindNftsByCandyMachineOperation): Promise<Nft[]> {
    const { input } = operation;
    let firstCreator: PublicKey;

    if (input.v1) {
      firstCreator = input.v1;
    } else if (input.v2) {
      // TODO: Refactor when we have a CandyMachine program in the SDK.
      [firstCreator] = await PublicKey.findProgramAddress(
        [Buffer.from('candy_machine'), input.v2.toBuffer()],
        new PublicKey('cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ')
      );
    } else {
      // TODO: Custom error.
      throw new Error('Candy Machine address not provided');
    }

    return this.metaplex.execute(
      new FindNftsByCreatorOperation({
        creator: firstCreator,
        position: 1,
      })
    );
  }
}
