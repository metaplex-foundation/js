import { Metaplex } from '@/Metaplex';
import { OperationHandler } from '@/shared';
import { Nft } from '../models';
import { FindNftByMintOperation } from '../operations/findNftByMintOperation';
import { MasterEditionAccount, MetadataAccount } from '@/programs';

export const findNftByMintOnChainOperationHandler: OperationHandler<FindNftByMintOperation> = {
  handle: async (operation: FindNftByMintOperation, metaplex: Metaplex): Promise<Nft> => {
    const mint = operation.input;
    const [metadataInfo, masterEditionInfo] = await metaplex.getMultipleAccountsInfo([
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

    const nft = new Nft(metadataAccount, metaplex);
    await nft.metadataTask.run();
    nft.masterEditionTask.loadWith(masterEditionAccount);

    return nft;
  },
};
