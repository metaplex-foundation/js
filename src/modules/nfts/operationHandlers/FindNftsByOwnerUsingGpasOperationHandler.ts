import { TokenProgram } from '@/programs';
import { OperationHandler } from '@/shared';
import { Nft } from '../models';
import { FindNftsByOwnerOperation } from '../operations/FindNftsByOwnerOperation';

export class FindNftsByOwnerUsingGpasOperationHandler extends OperationHandler<FindNftsByOwnerOperation> {
  public async handle(operation: FindNftsByOwnerOperation): Promise<Nft[]> {
    const owner = operation.input;

    const data = await TokenProgram.tokenAccounts(this.metaplex.connection)
      .selectMint()
      .whereOwner(owner)
      .get();

    console.log(data);

    return [];
  }
}
