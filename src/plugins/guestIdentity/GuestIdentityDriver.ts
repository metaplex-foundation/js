import { PublicKey, Transaction } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { IdentityDriver } from '@/types';
import { OperationUnauthorizedForGuestsError } from '@/errors';

export class GuestIdentityDriver extends IdentityDriver {
  public readonly publicKey: PublicKey;

  constructor(metaplex: Metaplex) {
    super(metaplex);
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
