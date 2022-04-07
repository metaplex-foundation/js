import { OperationHandler } from '@/shared';
import { Nft } from '../models';
import { FindNftByMintOperation } from '../operations/FindNftByMintOperation';
import { MetadataAccount } from '@/programs';

export class FindNftByMintOperationHandler extends OperationHandler<FindNftByMintOperation> {
  public async handle(operation: FindNftByMintOperation): Promise<Nft> {
    const mint = operation.input;
    const metadataPda = await MetadataAccount.pda(mint);
    const metadataInfo = await this.metaplex.getAccountInfo(metadataPda);
    const metadataAccount = metadataInfo ? MetadataAccount.fromAccountInfo(metadataInfo) : null;

    if (!metadataAccount) {
      // TODO: Custom error.
      throw new Error('Nft not found');
    }

    const nft = new Nft(metadataAccount);
    await nft.metadata.load(this.metaplex);

    return nft;
  }
}
