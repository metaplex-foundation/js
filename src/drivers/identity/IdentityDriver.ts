import { PublicKey, SendOptions, Signer, Transaction, TransactionSignature } from "@solana/web3.js";
import nacl from "tweetnacl";
import { Driver } from "../Driver";

export abstract class IdentityDriver extends Driver {
  public abstract publicKey: PublicKey;
  public abstract signMessage(message: Uint8Array): Promise<Uint8Array>;
  public abstract signTransaction(transaction: Transaction): Promise<Transaction>;
  public abstract signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
  public abstract sendTransaction(
    transaction: Transaction,
    signers: Signer[],
    options?: SendOptions
  ): Promise<TransactionSignature>;

  public async verifyMessage(message: Uint8Array, signature: Uint8Array): Promise<boolean> {
    return nacl.sign.detached.verify(message, signature, this.publicKey.toBytes());
  }

  public is(that: IdentityDriver): boolean {
    return this.publicKey.toBase58() === that.publicKey.toBase58();
  }
}
