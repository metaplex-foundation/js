import { PublicKey, Transaction } from '@solana/web3.js';
import { IdentityDriver } from './IdentityDriver';

export class GuestIdentityDriver implements IdentityDriver {
  public readonly publicKey: PublicKey;

  constructor() {
    this.publicKey = PublicKey.default;
  }

  async signTransaction(_transaction: Transaction) {
    // Do nothing...
  };
}
