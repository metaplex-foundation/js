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
      .getMultipleAccounts([metadataPda, masterEditionPda]);

    const metadataAccount = MetadataAccount.fromMaybe(metadataInfo);
    const masterEditionAccount = OriginalEditionAccount.fromMaybe(masterEditionInfo);

    if (!metadataAccount.exists) {
      throw new NftNotFoundError(mint);
    }

    const nft = new Nft(metadataAccount, metaplex);
    await nft.metadataTask.run();
    nft.masterEditionTask.loadWith(masterEditionAccount.exists ? masterEditionAccount : null);

    return nft;
  },
};
