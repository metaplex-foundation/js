import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { Buffer } from 'buffer';
import type { Metaplex } from '@/Metaplex';
import { Amount, IdentitySigner, KeypairSigner } from '@/types';

export class DerivedIdentityClient implements IdentitySigner, KeypairSigner {
  protected readonly metaplex: Metaplex;
  protected derivedKeypair: Keypair | null = null;

  constructor(metaplex: Metaplex) {
    this.metaplex = metaplex;
  }

  get publicKey(): PublicKey {
    if (this.derivedKeypair === null) {
      // TODO: Custom errors.
      throw new Error('Uninitialized derived identity');
    }

    return this.derivedKeypair.publicKey;
  }

  get secretKey(): Uint8Array {
    if (this.derivedKeypair === null) {
      // TODO: Custom errors.
      throw new Error('Uninitialized derived identity');
    }

    return this.derivedKeypair.secretKey;
  }

  async deriveFrom(message: string): Promise<void> {
    const signature = await this.metaplex
      .identity()
      .signMessage(Buffer.from(message));

    const seeds = nacl.hash(signature).slice(0, 32);

    this.derivedKeypair = Keypair.fromSeed(seeds);
  }

  fund(amount: Amount): void {
    // TODO
  }

  withdraw(amount: Amount): void {
    // TODO
  }

  withdrawAll(): void {
    // TODO
  }

  public async signMessage(message: Uint8Array): Promise<Uint8Array> {
    return nacl.sign.detached(message, this.secretKey);
  }

  public async signTransaction(transaction: Transaction): Promise<Transaction> {
    // TODO: Handle Error: Transaction recentBlockhash required.

    transaction.partialSign(this);

    return transaction;
  }

  public async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    return Promise.all(
      transactions.map((transaction) => this.signTransaction(transaction))
    );
  }
}
