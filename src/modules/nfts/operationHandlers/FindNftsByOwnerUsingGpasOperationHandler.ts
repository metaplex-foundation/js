import { MetadataAccount, TokenProgram } from '@/programs';
import { GmaBuilder, OperationHandler } from '@/shared';
import { Nft } from '../models';
import { FindNftsByOwnerOperation } from '../operations/FindNftsByOwnerOperation';

export class FindNftsByOwnerUsingGpasOperationHandler extends OperationHandler<FindNftsByOwnerOperation> {
  public async handle(operation: FindNftsByOwnerOperation): Promise<Nft[]> {
    const owner = operation.input;

    const mints = await TokenProgram.tokenAccounts(this.metaplex.connection)
      .selectMint()
      .whereOwner(owner)
      .whereAmount(1)
      .getDataAsPublicKeys();

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
