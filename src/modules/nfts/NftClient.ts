import { PublicKey } from "@solana/web3.js";
import { ModuleClient, MetadataAccount, MasterEditionAccount } from "@/modules/shared";
import { Nft } from "@/modules/nfts";

export class NftClient extends ModuleClient {
  //

  async findNftFromMint(mint: PublicKey): Promise<Nft | null> {
    const metadataPda = await MetadataAccount.pda(mint);
    const editionPda = await MasterEditionAccount.pda(mint);

    const [
      metadataAccountInfo,
      editionAccountInfo,
    ] = await this.metaplex.getMultipleAccountsInfo([metadataPda, editionPda]);

    if (!metadataAccountInfo) {
      return null;
    }

    return new Nft(
      MetadataAccount.fromAccountInfo(metadataAccountInfo), 
      editionAccountInfo ? MasterEditionAccount.fromAccountInfo(editionAccountInfo) : null,
    );
  }
}
