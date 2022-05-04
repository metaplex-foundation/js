import { Metaplex } from '@/Metaplex';
import { OperationHandler } from '@/drivers';
import { Nft } from '../models';
import { FindNftByMintOperation } from '../operations/findNftByMintOperation';
import { MetadataAccount, OriginalOrPrintEditionAccount } from '@/programs';
import { NftNotFoundError } from '@/errors';

export const findNftByMintOnChainOperationHandler: OperationHandler<FindNftByMintOperation> = {
  handle: async (operation: FindNftByMintOperation, metaplex: Metaplex): Promise<Nft> => {
    const mint = operation.input;
    const [metadata, edition] = await metaplex
      .rpc()
      .getMultipleAccounts([
        await MetadataAccount.pda(mint),
        await OriginalOrPrintEditionAccount.pda(mint),
      ]);

    const metadataAccount = MetadataAccount.fromMaybe(metadata);
    const editionAccount = OriginalOrPrintEditionAccount.fromMaybe(edition);

    if (!metadataAccount.exists) {
      throw new NftNotFoundError(mint);
    }

    const nft = new Nft(metadataAccount, metaplex);

    try {
      await nft.metadataTask.run();
    } catch (e) {
      // Fail silently...
    }

    nft.editionTask.loadWith(editionAccount.exists ? editionAccount : null);

    return nft;
  },
};
