import { PublicKey, Transaction } from '@solana/web3.js';
import { IdentityDriver } from './IdentityDriver';
import { Metaplex } from '@/Metaplex';

export class GuestIdentityDriver extends IdentityDriver {
  public readonly publicKey: PublicKey;

  constructor(metaplex: Metaplex) {
    super(metaplex);
    this.publicKey = PublicKey.default;
  }

  async signTransaction(_transaction: Transaction) {
    // Do nothing...
  };
}
