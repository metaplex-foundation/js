import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { Buffer } from 'buffer';
import type { Metaplex } from '@/Metaplex';
import { Amount, assertSol, IdentitySigner, KeypairSigner } from '@/types';
import { transferBuilder } from '@/programs';

export class DerivedIdentityClient implements IdentitySigner, KeypairSigner {
  protected readonly metaplex: Metaplex;
  protected derivedKeypair: Keypair | null = null;

  constructor(metaplex: Metaplex) {
    this.metaplex = metaplex;
  }

  get publicKey(): PublicKey {
    this.assertDerivedKeypairInitialized();

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

  async fund(amount: Amount): Promise<void> {
    this.assertDerivedKeypairInitialized();
    assertSol(amount);

    const transfer = transferBuilder({
      from: this.metaplex.identity(),
      to: this.derivedKeypair.publicKey,
      lamports: amount.basisPoints.toNumber(),
    });

    this.metaplex.rpc().sendAndConfirmTransaction(transfer);
  }

  withdraw(amount: Amount): void {
    assertSol(amount);

    // TODO
  }

  withdrawAll(): void {
    // TODO
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    return nacl.sign.detached(message, this.secretKey);
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    // TODO: Handle Error: Transaction recentBlockhash required.

    transaction.partialSign(this);

    return transaction;
  }

  async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    return Promise.all(
      transactions.map((transaction) => this.signTransaction(transaction))
    );
  }

  protected assertDerivedKeypairInitialized(): asserts this is {
    derivedKeypair: Keypair;
  } {
    if (this.derivedKeypair === null) {
      // TODO: Custom errors.
      throw new Error('Uninitialized derived identity');
    }
  }
}
