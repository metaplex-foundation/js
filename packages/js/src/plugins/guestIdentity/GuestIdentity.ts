import {
  Context,
  PublicKey,
  Signer,
  Transaction,
} from '@metaplex-foundation/js-core';
import { OperationUnauthorizedForGuestsError } from '@/errors';

export class GuestIdentity implements Signer {
  public readonly publicKey: PublicKey;

  constructor(context: Pick<Context, 'eddsa'>, publicKey?: PublicKey) {
    this.publicKey = publicKey ?? context.eddsa.createDefaultPublicKey();
  }

  public async signMessage(): Promise<Uint8Array> {
    throw new OperationUnauthorizedForGuestsError('signMessage');
  }

  public async signTransaction(): Promise<Transaction> {
    throw new OperationUnauthorizedForGuestsError('signTransaction');
  }

  public async signAllTransactions(): Promise<Transaction[]> {
    throw new OperationUnauthorizedForGuestsError('signAllTransactions');
  }
}
