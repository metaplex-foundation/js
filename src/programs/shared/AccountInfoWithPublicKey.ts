import { AccountInfo, PublicKey } from "@solana/web3.js";

export type AccountInfoWithPublicKey<T> = AccountInfo<T> & {
  pubkey: PublicKey;
}
