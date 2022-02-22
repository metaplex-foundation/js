import { PublicKey } from "@solana/web3.js";
import { MetadataProgram } from "@metaplex-foundation/mpl-token-metadata";
import { PdaAccount } from "@/modules/shared";
import { Pda } from "@/utils";

export class MetadataAccount extends PdaAccount {

  static async pda(mint: PublicKey): Promise<Pda> {
    return Pda.fromPromise(MetadataProgram.findMetadataAccount(mint))
  }

  //
}
