import { OperationHandler } from '@/shared/index';
import { Nft } from '../models/index';
import { FindNftByMintOperation } from '../operations/FindNftByMintOperation';
import { MasterEditionAccount, MetadataAccount } from '@/programs/index';

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

    const nft = new Nft(metadataAccount);
    await nft.metadataLoader.load(this.metaplex);
    nft.masterEditionLoader.loadWith(masterEditionAccount);

    return nft;
  }
}
