import { AccountInfo, PublicKey } from "@solana/web3.js";
import { Buffer } from 'buffer';
import { Metadata } from "@/programs/tokenMetadata/generated";
import { TokenMetadataProgram } from "@/programs/tokenMetadata";
import { Account } from "@/programs/shared";
import { JsonMetadata } from "@/modules/nfts";
import { fetchJson, Pda } from "@/utils";

export class MetadataAccount extends Account<Metadata> {

  static async pda(mint: PublicKey): Promise<Pda> {
    // return Pda.fromPromise(MetadataProgram.findMetadataAccount(mint));
    return Pda.find(TokenMetadataProgram.publicKey, [
      Buffer.from('metadata', 'utf8'),
      TokenMetadataProgram.publicKey.toBuffer(),
      mint.toBuffer(),
    ])
  }

  static fromAccountInfo(accountInfo: AccountInfo<Buffer>): MetadataAccount {
    return this.parseAccountInfo(accountInfo, Metadata) as MetadataAccount;
  }

  async getJson(): Promise<JsonMetadata | null> {
    return fetchJson<JsonMetadata>(this.data.data.uri);
  }
}
