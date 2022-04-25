import { Connection, PublicKey, Transaction, TransactionSignature } from '@solana/web3.js';
import {
  MessageSignerWalletAdapterProps,
  SignerWalletAdapterProps,
  SendTransactionOptions,
  WalletAdapter as BaseWalletAdapter,
} from '@solana/wallet-adapter-base';
import { IdentityDriver } from './IdentityDriver';
import { GuestIdentityDriver } from './GuestIdentityDriver';
import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/MetaplexPlugin';
import {
  OperationNotSupportedByWalletAdapterError,
  UninitializedWalletAdapterError,
} from '@/errors';

type WalletAdapter = BaseWalletAdapter &
  Partial<MessageSignerWalletAdapterProps> &
  Partial<SignerWalletAdapterProps>;

export const walletAdapterIdentity = (walletAdapter: WalletAdapter): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.setIdentity(new WalletAdapterIdentityDriver(metaplex, walletAdapter));
  },
});

export const walletOrGuestIdentity = (walletAdapter?: WalletAdapter | null): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const identity = walletAdapter
      ? new WalletAdapterIdentityDriver(metaplex, walletAdapter)
      : new GuestIdentityDriver(metaplex);

    metaplex.setIdentity(identity);
  },
});

export class WalletAdapterIdentityDriver extends IdentityDriver {
  public readonly walletAdapter: WalletAdapter;

  constructor(metaplex: Metaplex, walletAdapter: WalletAdapter) {
    super(metaplex);
    this.walletAdapter = walletAdapter;
  }

  get publicKey(): PublicKey {
    if (!this.walletAdapter.publicKey) {
      throw new UninitializedWalletAdapterError();
    }

    return this.walletAdapter.publicKey;
  }

  public async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (this.walletAdapter.signMessage === undefined) {
      throw new OperationNotSupportedByWalletAdapterError('signMessage');
    }

    return this.walletAdapter.signMessage(message);
  }

  public async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (this.walletAdapter.signTransaction === undefined) {
      throw new OperationNotSupportedByWalletAdapterError('signTransaction');
    }

    return this.walletAdapter.signTransaction(transaction);
  }

  public async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    if (this.walletAdapter.signAllTransactions === undefined) {
      throw new OperationNotSupportedByWalletAdapterError('signAllTransactions');
    }

    return this.walletAdapter.signAllTransactions(transactions);
  }

  public async sendTransaction(
    transaction: Transaction,
    _connection?: Connection,
    options?: SendTransactionOptions
  ): Promise<TransactionSignature> {
    const { signers, ...sendOptions } = options || {};

    // We accept a connection to match the wallet signature, but it is not used.
    // We use the RpcDriver to send the transaction to keep the single point of failure.
    return this.metaplex.rpc().sendTransaction(transaction, signers, sendOptions);
  }
}
