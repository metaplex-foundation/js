import { AccountInfo, PublicKey } from "@solana/web3.js";
import { MetadataProgram } from "@metaplex-foundation/mpl-token-metadata";
import { Account } from "@/modules/shared";
import { Pda } from "@/utils";
import { Metadata } from "@/modules/nfts/generated";

export class MetadataAccount extends Account<Metadata> {

  static async pda(mint: PublicKey): Promise<Pda> {
    return Pda.fromPromise(MetadataProgram.findMetadataAccount(mint));
  }

  static fromAccountInfo(accountInfo: AccountInfo<Buffer>): MetadataAccount {
    return this.parseAccountInfo(accountInfo, Metadata);
  }
}
