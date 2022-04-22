import { Metaplex } from '@/Metaplex';
import { OperationHandler } from '@/shared';
import { Nft } from '../models';
import { FindNftByMintOperation } from '../operations/findNftByMintOperation';
import { MetadataAccount, OriginalOrPrintEditionAccount } from '@/programs';
import { NftNotFoundError } from '@/errors';

export const findNftByMintOnChainOperationHandler: OperationHandler<FindNftByMintOperation> = {
  handle: async (operation: FindNftByMintOperation, metaplex: Metaplex): Promise<Nft> => {
    const mint = operation.input;
    const metadataPda = await MetadataAccount.pda(mint);
    const EditionPda = await OriginalOrPrintEditionAccount.pda(mint);
    const [metadataInfo, EditionInfo] = await metaplex
      .rpc()
      .getMultipleAccounts([metadataPda, EditionPda]);

    const metadataAccount = MetadataAccount.fromMaybe(metadataInfo);
    const EditionAccount = OriginalOrPrintEditionAccount.fromMaybe(EditionInfo);

    if (!metadataAccount.exists) {
      throw new NftNotFoundError(mint);
    }

    const nft = new Nft(metadataAccount, metaplex);
    await nft.metadataTask.run();
    nft.editionTask.loadWith(EditionAccount.exists ? EditionAccount : null);

    return nft;
  },
};
