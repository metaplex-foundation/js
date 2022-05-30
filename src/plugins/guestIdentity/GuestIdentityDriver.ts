import { PublicKey, Transaction } from '@solana/web3.js';
import { OperationUnauthorizedForGuestsError } from '@/errors';
import { IdentityDriver } from '../identityModule';

export class GuestIdentityDriver implements IdentityDriver {
  public readonly publicKey: PublicKey;

  constructor() {
    this.publicKey = PublicKey.default;
  }

  public async signMessage(_message: Uint8Array): Promise<Uint8Array> {
    throw new OperationUnauthorizedForGuestsError('signMessage');
  }

  public async signTransaction(
    _transaction: Transaction
  ): Promise<Transaction> {
    throw new OperationUnauthorizedForGuestsError('signTransaction');
  }

  public async signAllTransactions(
    _transactions: Transaction[]
  ): Promise<Transaction[]> {
    throw new OperationUnauthorizedForGuestsError('signAllTransactions');
  }
}
