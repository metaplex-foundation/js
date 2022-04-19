import { PublicKey, Transaction, TransactionSignature, SendOptions, Signer } from '@solana/web3.js';
import { IdentityDriver } from './IdentityDriver';
import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/MetaplexPlugin';
import { SdkError } from '@/errors';

export const guestIdentity = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.setIdentity(new GuestIdentityDriver(metaplex));
  },
});

export class GuestIdentityDriver extends IdentityDriver {
  public readonly publicKey: PublicKey;

  constructor(metaplex: Metaplex) {
    super(metaplex);
    this.publicKey = PublicKey.default;
  }

  public async signMessage(_message: Uint8Array): Promise<Uint8Array> {
    throw SdkError.operationUnauthorizedForGuests('signMessage');
  }

  public async signTransaction(_transaction: Transaction): Promise<Transaction> {
    throw SdkError.operationUnauthorizedForGuests('signTransaction');
  }

  public async signAllTransactions(_transactions: Transaction[]): Promise<Transaction[]> {
    throw SdkError.operationUnauthorizedForGuests('signAllTransactions');
  }

  public async sendTransaction(
    transaction: Transaction,
    signers: Signer[],
    options?: SendOptions
  ): Promise<TransactionSignature> {
    return this.metaplex.connection.sendTransaction(transaction, signers, options);
  }
}
