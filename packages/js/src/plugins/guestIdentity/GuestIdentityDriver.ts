import { PublicKey, Transaction } from '@solana/web3.js';
import { IdentityDriver } from '../identityModule';
import { OperationUnauthorizedForGuestsError } from '@metaplex-foundation/js';

export class GuestIdentityDriver implements IdentityDriver {
  public readonly publicKey: PublicKey;

  constructor(publicKey?: PublicKey) {
    this.publicKey = publicKey ?? PublicKey.default;
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
