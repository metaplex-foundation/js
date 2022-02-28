import { Keypair, PublicKey, Signer as Web3Signer, Transaction } from '@solana/web3.js';
import { IdentityDriver } from './IdentityDriver';

export class KeypairIdentityDriver implements IdentityDriver, Web3Signer {
  public readonly keypair: Keypair;
  public readonly publicKey: PublicKey;
  public readonly secretKey: Uint8Array;

  constructor(keypair: Keypair) {
    this.keypair = keypair;
    this.publicKey = keypair.publicKey;
    this.secretKey = keypair.secretKey;
  }

  async signTransaction(transaction: Transaction) {
    transaction.feePayer = this.publicKey;
    transaction.sign(this.keypair);
  };
}
