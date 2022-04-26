import { PublicKey, Transaction } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { Driver } from '../Driver';
import { Signer } from '@/shared';

export abstract class IdentityDriver extends Driver {
  public abstract publicKey: PublicKey;
  public abstract signMessage(message: Uint8Array): Promise<Uint8Array>;
  public abstract signTransaction(transaction: Transaction): Promise<Transaction>;
  public abstract signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;

  public async verifyMessage(message: Uint8Array, signature: Uint8Array): Promise<boolean> {
    return nacl.sign.detached.verify(message, signature, this.publicKey.toBytes());
  }

  public equals(that: Signer | PublicKey): boolean {
    if (!(that instanceof PublicKey)) {
      that = that.publicKey;
    }

    return this.publicKey.equals(that);
  }
}
