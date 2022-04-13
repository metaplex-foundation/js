import { TokenProgram } from '@/programs/index';
import { OperationHandler } from '@/shared/index';
import { Nft } from '../models/index';
import { FindNftsByMintListOperation, FindNftsByOwnerOperation } from '../operations/index';

export class FindNftsByOwnerOnChainOperationHandler extends OperationHandler<FindNftsByOwnerOperation> {
  public async handle(operation: FindNftsByOwnerOperation): Promise<Nft[]> {
    const owner = operation.input;

    const mints = await TokenProgram.tokenAccounts(this.metaplex.connection)
      .selectMint()
      .whereOwner(owner)
      .whereAmount(1)
      .getDataAsPublicKeys();

    const nfts = await this.metaplex.execute(new FindNftsByMintListOperation(mints));

    return nfts.filter((nft): nft is Nft => nft !== null);
  }
}
