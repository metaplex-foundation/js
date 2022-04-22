import { Metaplex } from '@/Metaplex';
import { OperationHandler } from '@/shared';
import { Nft } from '../models';
import { FindNftByMintOperation } from '../operations/findNftByMintOperation';
import { OriginalEditionAccount, MetadataAccount } from '@/programs';
import { NftNotFoundError } from '@/errors';

export const findNftByMintOnChainOperationHandler: OperationHandler<FindNftByMintOperation> = {
  handle: async (operation: FindNftByMintOperation, metaplex: Metaplex): Promise<Nft> => {
    const mint = operation.input;
    const metadataPda = await MetadataAccount.pda(mint);
    const masterEditionPda = await OriginalEditionAccount.pda(mint);
    const [metadataInfo, masterEditionInfo] = await metaplex
      .rpc()
      .getMultipleAccountsInfo([metadataPda, masterEditionPda]);

    const metadataAccount = metadataInfo
      ? MetadataAccount.fromAccountInfo(metadataPda, metadataInfo)
      : null;
    const masterEditionAccount = masterEditionInfo
      ? OriginalEditionAccount.fromAccountInfo(masterEditionPda, masterEditionInfo)
      : null;

    if (!metadataAccount) {
      throw new NftNotFoundError(mint);
    }

    const nft = new Nft(metadataAccount, metaplex);
    await nft.metadataTask.run();
    nft.masterEditionTask.loadWith(masterEditionAccount);

    return nft;
  },
};
