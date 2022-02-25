import { AccountInfo, PublicKey } from "@solana/web3.js";
import { MetadataProgram } from "@metaplex-foundation/mpl-token-metadata";
import { Account } from "@/programs/shared";
import { Metadata } from "@/programs/tokenMetadata/generated";
import { JsonMetadata } from "@/modules/nfts";
import { fetchJson, Pda } from "@/utils";

export class MetadataAccount extends Account<Metadata> {

  static async pda(mint: PublicKey): Promise<Pda> {
    return Pda.fromPromise(MetadataProgram.findMetadataAccount(mint));
  }

  static fromAccountInfo(accountInfo: AccountInfo<Buffer>): MetadataAccount {
    return this.parseAccountInfo(accountInfo, Metadata) as MetadataAccount;
  }

  async getJson(): Promise<JsonMetadata | null> {
    return fetchJson<JsonMetadata>(this.data.data.uri);
  }
}
