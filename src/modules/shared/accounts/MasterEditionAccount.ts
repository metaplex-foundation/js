import { AccountInfo, PublicKey } from "@solana/web3.js";
import { MetadataProgram } from "@metaplex-foundation/mpl-token-metadata";
import { Account } from "@/modules/shared";
import { Pda } from "@/utils";
import { MasterEditionV1, MasterEditionV2, Key } from "@/modules/nfts/generated";

export class MasterEditionAccount extends Account<MasterEditionV1 | MasterEditionV2> {

  static async pda(mint: PublicKey): Promise<Pda> {
    return Pda.fromPromise(MetadataProgram.findMasterEditionAccount(mint));
  }

  static fromAccountInfo(accountInfo: AccountInfo<Buffer>): MasterEditionAccount {
    if (accountInfo.data?.[0] === Key.MasterEditionV1) {
      return this.parseAccountInfo(accountInfo, MasterEditionV1);
    }

    return this.parseAccountInfo(accountInfo, MasterEditionV2);
  }
}
