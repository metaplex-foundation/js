import { Keypair } from './KeyPair';
import { PublicKey } from './PublicKey';
import { Transaction } from './Transaction';

export type Signer = {
  publicKey: PublicKey;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
};

export const createSignerFromKeypair = (keypair: Keypair): Signer => {
  throw new Error('Not implemented');
};
