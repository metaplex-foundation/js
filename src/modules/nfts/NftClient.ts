import { PublicKey } from "@solana/web3.js";
import { ModuleClient, Account } from "@/modules/shared";
import { Nft } from "@/modules/nfts";
import { MetadataProgram } from "@metaplex-foundation/mpl-token-metadata";
import { Metadata, MasterEditionV2 } from "@/modules/nfts/generated";

export class NftClient extends ModuleClient {
  //

  async findNftFromMint(mint: PublicKey): Promise<Nft | null> {
    const metadataPda = (await MetadataProgram.findMetadataAccount(mint))[0];
    const editionPda = (await MetadataProgram.findMasterEditionAccount(mint))[0];

    const [
      metadataAccountInfo,
      editionAccountInfo,
    ] = await this.metaplex.getMultipleAccountsInfo([
      metadataPda, editionPda
    ]);

    if (!metadataAccountInfo) {
      return null;
    }

    const metadataAccount = Account.parseAccountInfo(metadataAccountInfo, Metadata);
    const editionAccount = editionAccountInfo ? Account.parseAccountInfo(editionAccountInfo, MasterEditionV2) : null;

    return new Nft(metadataAccount, editionAccount);
  }
}
