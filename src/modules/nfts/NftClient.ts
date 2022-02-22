import { AccountInfo, PublicKey } from "@solana/web3.js";
import { ModuleClient } from "@/modules/shared";
import { Nft } from "@/modules/nfts";
import { MetadataProgram } from "@metaplex-foundation/mpl-token-metadata";
import { Metadata, MasterEditionV2 } from "@/modules/nfts/generated";

const parseAccountInfo = <T>(accountInfo: AccountInfo<Buffer>, dataType: { fromAccountInfo: (info: AccountInfo<Buffer>) => [T, number] }) => {
  return {
    ...accountInfo,
    data: dataType.fromAccountInfo(accountInfo)[0],
  }
}

export class NftClient extends ModuleClient {
  //

  async findNftFromMint(mint: PublicKey): Promise<Nft | null> {
    const metadataPda = (await MetadataProgram.findMetadataAccount(mint))[0];
    const editionPda = (await MetadataProgram.findMasterEditionAccount(mint))[0];

    const [
      mintAccountInfo,
      metadataAccountInfo,
      editionAccountInfo,
    ] = await this.metaplex.getMultipleAccountsInfo([
      mint, metadataPda, editionPda
    ]);

    if (!metadataAccountInfo) {
      return null;
    }

    const metadataAccount = parseAccountInfo(metadataAccountInfo, Metadata);
    const editionAccount = editionAccountInfo ? parseAccountInfo(editionAccountInfo, MasterEditionV2) : null;

    return new Nft(metadataAccount, editionAccount);
  }
}
