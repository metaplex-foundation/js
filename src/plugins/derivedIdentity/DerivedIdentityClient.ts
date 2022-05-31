import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { Buffer } from 'buffer';
import type { Metaplex } from '@/Metaplex';
import {
  Amount,
  assertSol,
  IdentitySigner,
  KeypairSigner,
  Signer,
} from '@/types';
import { transferBuilder } from '@/programs';

export class DerivedIdentityClient implements IdentitySigner, KeypairSigner {
  protected readonly metaplex: Metaplex;
  protected originalSigner: Signer | null = null;
  protected derivedKeypair: Keypair | null = null;

  constructor(metaplex: Metaplex) {
    this.metaplex = metaplex;
  }

  get publicKey(): PublicKey {
    this.assertInitialized();

    return this.derivedKeypair.publicKey;
  }

  get secretKey(): Uint8Array {
    this.assertInitialized();

    return this.derivedKeypair.secretKey;
  }

  async deriveFrom(message: string | Uint8Array): Promise<void> {
    this.originalSigner = this.metaplex.identity();

    const signature = await this.originalSigner.signMessage(
      Buffer.from(message)
    );

    const seeds = nacl.hash(signature).slice(0, 32);

    this.derivedKeypair = Keypair.fromSeed(seeds);
  }

  async fund(amount: Amount): Promise<void> {
    this.assertInitialized();
    assertSol(amount);

    const transfer = transferBuilder({
      from: this.originalSigner,
      to: this.derivedKeypair.publicKey,
      lamports: amount.basisPoints.toNumber(),
    });

    this.metaplex.rpc().sendAndConfirmTransaction(transfer);
  }

  async withdraw(amount: Amount): Promise<void> {
    this.assertInitialized();
    assertSol(amount);

    const transfer = transferBuilder({
      from: this.derivedKeypair,
      to: this.originalSigner.publicKey,
      lamports: amount.basisPoints.toNumber(),
    });

    this.metaplex.rpc().sendAndConfirmTransaction(transfer);
  }

  async withdrawAll(): Promise<void> {
    this.assertInitialized();

    const balance = await this.metaplex
      .rpc()
      .getBalance(this.derivedKeypair.publicKey);

    this.withdraw(balance);
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

  protected assertInitialized(): asserts this is {
    originalSigner: Signer;
    derivedKeypair: Keypair;
  } {
    if (this.derivedKeypair === null || this.originalSigner === null) {
      // TODO: Custom errors.
      throw new Error('Uninitialized derived identity');
    }
  }
}
