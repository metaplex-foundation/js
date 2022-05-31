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
import { UninitializedDerivedIdentityError } from './errors';

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

  get originalPublicKey(): PublicKey {
    this.assertInitialized();

    return this.originalSigner.publicKey;
  }

  async deriveFrom(
    message: string | Uint8Array,
    originalSigner?: IdentitySigner
  ): Promise<void> {
    this.originalSigner = originalSigner ?? this.metaplex.identity().driver();

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

    await this.metaplex.rpc().sendAndConfirmTransaction(transfer);
  }

  async withdraw(amount: Amount): Promise<void> {
    this.assertInitialized();
    assertSol(amount);

    const transfer = transferBuilder({
      from: this.derivedKeypair,
      to: this.originalSigner.publicKey,
      lamports: amount.basisPoints.toNumber(),
    });

    await this.metaplex.rpc().sendAndConfirmTransaction(transfer);
  }

  async withdrawAll(): Promise<void> {
    this.assertInitialized();

    const balance = await this.metaplex
      .rpc()
      .getBalance(this.derivedKeypair.publicKey);

    await this.withdraw(balance);
  }

  close(): void {
    this.originalSigner = null;
    this.derivedKeypair = null;
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    return nacl.sign.detached(message, this.secretKey);
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
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

  verifyMessage(message: Uint8Array, signature: Uint8Array): boolean {
    return nacl.sign.detached.verify(
      message,
      signature,
      this.publicKey.toBytes()
    );
  }

  equals(that: Signer | PublicKey): boolean {
    if ('publicKey' in that) {
      that = that.publicKey;
    }

    return this.publicKey.equals(that);
  }

  assertInitialized(): asserts this is {
    originalSigner: Signer;
    derivedKeypair: Keypair;
  } {
    if (this.derivedKeypair === null || this.originalSigner === null) {
      throw new UninitializedDerivedIdentityError();
    }
  }
}
