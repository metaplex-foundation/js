import { PublicKey, SendOptions, Signer, Transaction, TransactionSignature } from '@solana/web3.js';
import { MessageSignerWalletAdapterProps, SignerWalletAdapterProps, WalletAdapter as BaseWalletAdapter } from '@solana/wallet-adapter-base';
import { IdentityDriver } from './IdentityDriver';
import { Metaplex } from '@/Metaplex';

type WalletAdapter = BaseWalletAdapter
  & Partial<MessageSignerWalletAdapterProps>
  & Partial<SignerWalletAdapterProps>;

export class WalletAdapterIdentityDriver extends IdentityDriver {
  public readonly walletAdapter: WalletAdapter;

  constructor(metaplex: Metaplex, walletAdapter: WalletAdapter) {
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

  public async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (this.walletAdapter.signMessage === undefined) {
      // TODO: Custom errors.
      throw new Error("The provided wallet adapter does not support signing messages.");
    }

    return this.walletAdapter.signMessage(message);
  };

  public async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (this.walletAdapter.signTransaction === undefined) {
      // TODO: Custom errors.
      throw new Error("The provided wallet adapter does not support signing transactions.");
    }

    return this.walletAdapter.signTransaction(transaction);
  };

  public async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    if (this.walletAdapter.signAllTransactions === undefined) {
      // TODO: Custom errors.
      throw new Error("The provided wallet adapter does not support signing transactions.");
    }

    return this.walletAdapter.signAllTransactions(transactions);
  };

  public async sendTransaction(
    transaction: Transaction,
    signers: Signer[],
    options?: SendOptions,
  ): Promise<TransactionSignature> {
    return this.walletAdapter.sendTransaction(transaction, this.metaplex.connection, { signers, ...options })
  };
}
