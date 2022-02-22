import { AccountInfo, PublicKey } from "@solana/web3.js";
import { ModuleClient } from "@/modules/shared";
import { Nft } from "@/modules/nfts";
import { MetadataProgram } from "@metaplex-foundation/mpl-token-metadata";
import { Metadata, MasterEditionV2 } from "@/modules/nfts/generated";

export class NftClient extends ModuleClient {
  //

  async findNftFromMint(mint: PublicKey): Promise<Nft | null> {
    const metadataPda = (await MetadataProgram.findMetadataAccount(mint))[0];
    const editionPda = (await MetadataProgram.findMasterEditionAccount(mint))[0];

    const [
      mintAccountInfo,
      metadataAccountInfo,
      editionAccountInfo,
    ] = await this.metaplex.connection.getMultipleAccountsInfo([
      mint, metadataPda, editionPda
    ]);

    if (!metadataAccountInfo) {
      return null;
    }

    const metadataAccount = Metadata.fromAccountInfo(metadataAccountInfo as AccountInfo<Buffer>)[0];
    const editionAccount = editionAccountInfo ? MasterEditionV2.fromAccountInfo(editionAccountInfo as AccountInfo<Buffer>)[0] : null;

    return new Nft(metadataAccount, editionAccount);
  }
}
