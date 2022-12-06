import {
  Context,
  createSignerFromKeypair,
  Keypair,
  PublicKey,
  Signer,
  Transaction,
} from '@metaplex-foundation/js-core';

export class KeypairIdentity implements Signer, Keypair {
  public readonly keypair: Keypair;
  public readonly publicKey: PublicKey;
  public readonly secretKey: Uint8Array;
  protected readonly _signer: Signer;

  constructor(context: Pick<Context, 'eddsa'>, keypair: Keypair) {
    this.keypair = keypair;
    this.publicKey = keypair.publicKey;
    this.secretKey = keypair.secretKey;
    this._signer = createSignerFromKeypair(context, keypair);
  }

  public async signMessage(message: Uint8Array): Promise<Uint8Array> {
    return this._signer.signMessage(message);
  }

  public async signTransaction(transaction: Transaction): Promise<Transaction> {
    return this._signer.signTransaction(transaction);
  }

  public async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    return this._signer.signAllTransactions(transactions);
  }
}
