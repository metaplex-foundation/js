import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { IdentityDriver } from './IdentityDriver';

export class KeypairIdentityDriver implements IdentityDriver {
  public readonly keypair: Keypair;
  public readonly publicKey: PublicKey;

  constructor(keypair: Keypair) {
    this.keypair = keypair;
    this.publicKey = keypair.publicKey;
  }

  async signTransaction(transaction: Transaction) {
    transaction.feePayer = this.publicKey;
    transaction.sign(this.keypair);
  };
}
