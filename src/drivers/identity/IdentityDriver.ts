import { PublicKey, Transaction } from "@solana/web3.js";

export interface IdentityDriver {
  publicKey: PublicKey;
  signTransaction: (tx: Transaction) => Promise<void>;
}
