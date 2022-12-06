import type { Keypair } from './KeyPair';
import type { PublicKey } from './PublicKey';
import type { Transaction } from './Transaction';

export type Signer = {
  publicKey: PublicKey;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
export const createSignerFromKeypair = (keypair: Keypair): Signer => {
  throw new Error('Not implemented');
};
