import { TokenMetadataProgram } from '../../../programs/index.js';
import { OperationHandler } from '../../../shared/index.js';
import { Nft } from '../models/index.js';
import { FindNftsByMintListOperation, FindNftsByCreatorOperation } from '../operations/index.js';

export class FindNftsByCreatorOnChainOperationHandler extends OperationHandler<FindNftsByCreatorOperation> {
  public async handle(operation: FindNftsByCreatorOperation): Promise<Nft[]> {
    const { creator, position = 1 } = operation.input;

    const mints = await TokenMetadataProgram.metadataV1Accounts(this.metaplex.connection)
      .selectMint()
      .whereCreator(position, creator)
      .getDataAsPublicKeys();

    const nfts = await this.metaplex.execute(new FindNftsByMintListOperation(mints));

    return nfts.filter((nft): nft is Nft => nft !== null);
  }
}
