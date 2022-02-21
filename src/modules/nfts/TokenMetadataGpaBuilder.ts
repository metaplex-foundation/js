import { MetadataProgram } from "@metaplex-foundation/mpl-token-metadata";
import { Connection } from "@solana/web3.js";
import BN from "bn.js";
import { GpaBuilder } from "@/utils";
import { Key } from "./generated/types";

export class TokenMetadataGpaBuilder extends GpaBuilder {
  constructor(connection: Connection) {
    super(connection, MetadataProgram.PUBKEY);
  }

  whereKey(key: Key) {
    return this.where(0, new BN(key, 'le'));
  }
}
