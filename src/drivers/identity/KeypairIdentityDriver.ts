import { Keypair, PublicKey, Signer as Web3Signer, Transaction } from '@solana/web3.js';
import { IdentityDriver } from './IdentityDriver';
import { Metaplex } from '@/Metaplex';

export class KeypairIdentityDriver extends IdentityDriver implements Web3Signer {
  public readonly keypair: Keypair;
  public readonly publicKey: PublicKey;
  public readonly secretKey: Uint8Array;

  constructor(metaplex: Metaplex, keypair: Keypair) {
    super(metaplex);
    this.keypair = keypair;
    this.publicKey = keypair.publicKey;
    this.secretKey = keypair.secretKey;
  }

  async signTransaction(transaction: Transaction) {
    transaction.feePayer = this.publicKey;
    transaction.sign(this.keypair);
  };
}
