import { PublicKey, Transaction } from '@solana/web3.js';
import { SignerWalletAdapter } from '@solana/wallet-adapter-base';
import { IdentityDriver } from './IdentityDriver';
import { Metaplex } from '@/Metaplex';

export class WalletAdapterIdentityDriver extends IdentityDriver {
  public readonly walletAdapter: SignerWalletAdapter;

  constructor(metaplex: Metaplex, walletAdapter: SignerWalletAdapter) {
    super(metaplex);
    this.walletAdapter = walletAdapter;
  }

  get publicKey(): PublicKey {
    if (!this.walletAdapter.publicKey) {
      // TODO: Custom errors.
      throw new Error('Wallet adapter not initialized');
    }

    return this.walletAdapter.publicKey;
  }

  public async signTransaction(transaction: Transaction) {
    transaction.feePayer = this.publicKey;
    await this.walletAdapter.signTransaction(transaction);
  };
}
