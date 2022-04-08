import { MetadataAccount } from '@/programs';
import { GmaBuilder, OperationHandler } from '@/shared';
import { Nft } from '../models';
import { FindNftsByMintListOperation } from '../operations/FindNftsByMintListOperation';

export class FindNftsByMintListOnChainOperationHandler extends OperationHandler<FindNftsByMintListOperation> {
  public async handle(operation: FindNftsByMintListOperation): Promise<Nft[]> {
    const mints = operation.input;
    const metadataPdas = await Promise.all(mints.map((mint) => MetadataAccount.pda(mint)));
    const metadataInfos = await GmaBuilder.make(this.metaplex.connection, metadataPdas).get();

    return metadataInfos.flatMap((metadataInfo) => {
      if (!metadataInfo || !metadataInfo.exists) return [];

      try {
        const metadata = MetadataAccount.fromAccountInfo(metadataInfo);
        return [new Nft(metadata)];
      } catch (error) {
        return [];
      }
    });
  }
}
