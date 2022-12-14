import { Context } from './Context';
import type { Keypair } from './KeyPair';
import type { PublicKey } from './PublicKey';
import type { Transaction } from './Transaction';

export type Signer = {
  publicKey: PublicKey;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
};

export const isSigner = (value: PublicKey | Signer): value is Signer => {
  return 'publicKey' in value;
};

export const createSignerFromKeypair = (
  context: Pick<Context, 'eddsa'>,
  keypair: Keypair
): Signer => {
  return {
    publicKey: keypair.publicKey,
    async signMessage(message: Uint8Array): Promise<Uint8Array> {
      return context.eddsa.sign(message, keypair);
    },
    async signTransaction(transaction: Transaction): Promise<Transaction> {
      transaction.sign([keypair]);

      return transaction;
    },
    async signAllTransactions(
      transactions: Transaction[]
    ): Promise<Transaction[]> {
      return Promise.all(
        transactions.map((transaction) => this.signTransaction(transaction))
      );
    },
  };
};

export class NullSigner implements Signer {
  // TODO(loris): Custom errors.
  get publicKey(): PublicKey {
    throw new Error('Method not implemented.');
  }
  signMessage(): Promise<Uint8Array> {
    throw new Error('Method not implemented.');
  }
  signTransaction(): Promise<Transaction> {
    throw new Error('Method not implemented.');
  }
  signAllTransactions(): Promise<Transaction[]> {
    throw new Error('Method not implemented.');
  }
}
