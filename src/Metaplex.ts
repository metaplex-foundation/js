import { AccountInfo, Commitment, ConfirmOptions, Connection, Keypair, PublicKey, RpcResponseAndContext, SendOptions, SignatureResult, Transaction, TransactionSignature } from "@solana/web3.js";
import { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { Buffer } from 'buffer';
import { TransactionBuilder } from "@/programs/shared";
import { IdentityDriver, GuestIdentityDriver, KeypairIdentityDriver, WalletAdapterIdentityDriver } from "@/drivers";
import { Signer, getSignerHistogram } from "@/utils";
import { NftClient } from "./modules";

export interface MetaplexOptions {
  // identity?: IdentityDriver,
  // storage?: StorageDriver,
  // filesystem?: FilesystemDriver,
  // rateConverter?: RateConverterDriver,
}

export class Metaplex {

  /** The connection object from Solana's SDK. */
  public readonly connection: Connection;

  /** Options that dictate how to interact with the Metaplex SDK. */
  public readonly options: MetaplexOptions;

  /** Encapsulates the identity of the users interacting with the SDK. */
  protected identityDriver: IdentityDriver;

  constructor(connection: Connection, options: MetaplexOptions = {}) {
    this.connection = connection;
    this.options = options;
    this.identityDriver = new GuestIdentityDriver(this);
  }

  static make(connection: Connection, options: MetaplexOptions = {}) {
    return new this(connection, options);
  }

  identity() {
    return this.identityDriver;
  }

  setIdentity(identity: IdentityDriver) {
    this.identityDriver = identity;

    return this;
  }

  useKeypairIdentity(keypair: Keypair) {
    return this.setIdentity(new KeypairIdentityDriver(this, keypair));
  }

  useWalletAdapterIdentity(walletAdapter: SignerWalletAdapter) {
    return this.setIdentity(new WalletAdapterIdentityDriver(this, walletAdapter));
  }

  useGuestIdentity() {
    return this.setIdentity(new GuestIdentityDriver(this));
  }

  nfts() {
    return new NftClient(this);
  }

  async sendTransaction(
    transaction: Transaction | TransactionBuilder,
    signers: Signer[] = [],
    sendOptions: SendOptions = {},
  ): Promise<TransactionSignature> {
    if (transaction instanceof TransactionBuilder) {
      signers = [...transaction.getSigners(), ...signers];
      transaction = transaction.toTransaction();
    }

    const { keypairs, identities } = getSignerHistogram(signers);

    for (let i = 0; i < identities.length; i++) {
      if (!identities[i].is(this.identity())) {
        await identities[i].signTransaction(transaction);
      }
    }

    return this.identity().sendTransaction(transaction, keypairs, sendOptions)
  }

  async confirmTransaction(
    signature: TransactionSignature,
    commitment?: Commitment,
  ): Promise<RpcResponseAndContext<SignatureResult>> {
    const rpcResponse = await this.connection.confirmTransaction(signature, commitment);

    if (rpcResponse.value.err) {
      // TODO: Custom errors.
      throw new Error(
        `Transaction ${signature} failed (${JSON.stringify(rpcResponse.value)})`,
      );
    }

    return rpcResponse;
  }

  async sendAndConfirmTransaction(
    transaction: Transaction | TransactionBuilder,
    signers?: Signer[],
    confirmOptions?: ConfirmOptions,
  ): Promise<TransactionSignature> {
    const signature = await this.sendTransaction(transaction, signers, confirmOptions);
    await this.confirmTransaction(signature, confirmOptions?.commitment);

    return signature;
  }

  async getAccountInfo(publicKey: PublicKey, commitment?: Commitment) {
    return this.connection.getAccountInfo(publicKey, commitment)
  }

  async getMultipleAccountsInfo(publicKeys: PublicKey[], commitment?: Commitment) {
    const accounts = await this.connection.getMultipleAccountsInfo(publicKeys, commitment);
    
    return accounts as Array<AccountInfo<Buffer> | null>;
  }
}
