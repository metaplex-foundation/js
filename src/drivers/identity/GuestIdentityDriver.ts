import { PublicKey, Transaction, TransactionSignature, SendOptions, Signer } from '@solana/web3.js';
import { IdentityDriver } from './IdentityDriver';
import { Metaplex } from '@/Metaplex';

export class GuestIdentityDriver extends IdentityDriver {
  public readonly publicKey: PublicKey;

  constructor(metaplex: Metaplex) {
    super(metaplex);
    this.publicKey = PublicKey.default;
  }

  public async signMessage(_message: Uint8Array): Promise<Uint8Array> {
    // TODO: Custom errors.
    throw new Error('Guests cannot sign messages.');
  };

  public async signTransaction(_transaction: Transaction): Promise<Transaction> {
    // TODO: Custom errors.
    throw new Error('Guests cannot sign transactions.');
  };

  public async signAllTransactions(_transactions: Transaction[]): Promise<Transaction[]> {
    // TODO: Custom errors.
    throw new Error('Guests cannot sign transactions.');
  };

  public async sendTransaction(
    transaction: Transaction,
    signers: Signer[],
    options?: SendOptions,
  ): Promise<TransactionSignature> {
    return this.metaplex.connection
      .sendTransaction(transaction, signers, options);
  };
}
