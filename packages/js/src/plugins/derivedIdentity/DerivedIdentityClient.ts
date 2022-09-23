import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { Buffer } from 'buffer';
import type { Metaplex } from '@/Metaplex';
import {
  IdentitySigner,
  isSigner,
  KeypairSigner,
  Signer,
  SolAmount,
} from '@/types';
import { UninitializedDerivedIdentityError } from './errors';
import { Task } from '@/utils';
import { TransferSolOutput } from '../systemModule';

/**
 * @group Modules
 */
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

  deriveFrom(
    message: string | Uint8Array,
    originalSigner?: IdentitySigner
  ): Task<void> {
    return new Task(async () => {
      this.originalSigner = originalSigner ?? this.metaplex.identity().driver();

      const signature = await this.originalSigner.signMessage(
        Buffer.from(message)
      );

      const seeds = nacl.hash(signature).slice(0, 32);

      this.derivedKeypair = Keypair.fromSeed(seeds);
    });
  }

  fund(amount: SolAmount): Task<TransferSolOutput> {
    this.assertInitialized();
    return this.metaplex.system().transferSol({
      from: this.originalSigner,
      to: this.derivedKeypair.publicKey,
      amount,
    });
  }

  withdraw(amount: SolAmount): Task<TransferSolOutput> {
    this.assertInitialized();
    return this.metaplex.system().transferSol({
      from: this.derivedKeypair,
      to: this.originalSigner.publicKey,
      amount,
    });
  }

  withdrawAll(): Task<TransferSolOutput> {
    this.assertInitialized();
    return new Task(async (scope) => {
      this.assertInitialized();
      const balance = await this.metaplex
        .rpc()
        .getBalance(this.derivedKeypair.publicKey);
      return this.withdraw(balance).run(scope);
    });
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
    if (isSigner(that)) {
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
