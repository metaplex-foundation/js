import { PublicKey } from "@solana/web3.js";
import { TokenMetadataGpaBuilder } from "./TokenMetadataGpaBuilder";
import { padEmptyChars } from "@/utils";

const MAX_NAME_LENGTH = 32;
const MAX_SYMBOL_LENGTH = 10;
const MAX_URI_LENGTH = 200;
const MAX_CREATOR_LEN = 32 + 1 + 1;
const DATA_START = 1 + 32 + 32;
const NAME_START = DATA_START + 4;
const SYMBOL_START = NAME_START + MAX_NAME_LENGTH + 4;
const URI_START = SYMBOL_START + MAX_SYMBOL_LENGTH + 4;
const CREATORS_START = URI_START + MAX_URI_LENGTH + 2 + 1 + 4;

export class MetadataV1GpaBuilder extends TokenMetadataGpaBuilder {

  whereUpdateAuthority(updateAuthority: PublicKey) {
    return this.where(1, updateAuthority);
  }

  whereMint(mint: PublicKey) {
    return this.where(33, mint);
  }

  whereName(name: string) {
    return this.where(NAME_START, Buffer.from(padEmptyChars(name, MAX_NAME_LENGTH)));
  }

  whereSymbol(symbol: string) {
    return this.where(SYMBOL_START, Buffer.from(padEmptyChars(symbol, MAX_SYMBOL_LENGTH)));
  }

  whereUri(uri: string) {
    return this.where(URI_START, Buffer.from(padEmptyChars(uri, MAX_URI_LENGTH)));
  }

  whereCreator(nth: number, creator: PublicKey) {
    return this.where(CREATORS_START + (nth - 1) * MAX_CREATOR_LEN, creator);
  }

  whereFirstCreator(firstCreator: PublicKey) {
    return this.whereCreator(1, firstCreator);
  }
}
