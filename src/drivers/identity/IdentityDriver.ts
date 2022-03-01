import { PublicKey, Transaction } from "@solana/web3.js";
import { Driver } from "@/drivers";

export abstract class IdentityDriver extends Driver {
  public abstract publicKey: PublicKey;
  public abstract signTransaction(tx: Transaction): Promise<void>;
}
