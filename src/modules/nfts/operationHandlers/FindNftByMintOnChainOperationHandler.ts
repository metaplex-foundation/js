import { OperationHandler } from '@/shared';
import { Nft } from '../models';
import { FindNftByMintOperation } from '../operations/FindNftByMintOperation';
import { MasterEditionAccount, MetadataAccount } from '@/programs';

export class FindNftByMintOnChainOperationHandler extends OperationHandler<FindNftByMintOperation> {
  public async handle(operation: FindNftByMintOperation): Promise<Nft> {
    const mint = operation.input;
    const [metadataInfo, masterEditionInfo] = await this.metaplex.getMultipleAccountsInfo([
      await MetadataAccount.pda(mint),
      await MasterEditionAccount.pda(mint),
    ]);

    const metadataAccount = metadataInfo ? MetadataAccount.fromAccountInfo(metadataInfo) : null;
    const masterEditionAccount = masterEditionInfo
      ? MasterEditionAccount.fromAccountInfo(masterEditionInfo)
      : null;

    if (!metadataAccount) {
      // TODO: Custom error.
      throw new Error('Nft not found');
    }

    const nft = new Nft(metadataAccount, this.metaplex);
    await nft.metadataLoader.load();
    nft.masterEditionLoader.loadWith(masterEditionAccount);

    return nft;
  }
}
