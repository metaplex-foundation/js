import {
  AccountInfo,
  Commitment,
  ConfirmOptions,
  Connection,
  ConnectionConfig,
  PublicKey,
  RpcResponseAndContext,
  SendOptions,
  SignatureResult,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import { Buffer } from "buffer";
import { TransactionBuilder } from "@/programs/shared";
import { IdentityDriver, GuestIdentityDriver } from "@/drivers/identity";
import { StorageDriver, BundlrStorageDriver } from "@/drivers/storage";
import { Signer, getSignerHistogram } from "@/utils";
import { NftClient } from "./modules";
import { Driver } from "./drivers/Driver";

export type DriverInstaller<T extends Driver> = (metaplex: Metaplex) => T;

export type MetaplexOptions = ConnectionConfig & {
  // ...
};

export class Metaplex {
  /** The RPC endpoint to use to communicate to the blockchain. */
  public readonly endpoint: string;

  /** The connection object from Solana's SDK. */
  public readonly connection: Connection;

  /** Options that dictate how to interact with the Metaplex SDK. */
  public readonly options: MetaplexOptions;

  /** Encapsulates the identity of the users interacting with the SDK. */
  protected identityDriver: IdentityDriver;

  /** Encapsulates where assets should be uploaded. */
  protected storageDriver: StorageDriver;

  constructor(endpoint: string, options: MetaplexOptions = {}) {
    this.endpoint = endpoint;
    this.connection = new Connection(endpoint, options);
    this.options = options;
    this.identityDriver = new GuestIdentityDriver(this);
    this.storageDriver = new BundlrStorageDriver(this);
  }

  static make(endpoint: string, options: MetaplexOptions = {}) {
    return new this(endpoint, options);
  }

  identity() {
    return this.identityDriver;
  }

  setIdentity(identity: IdentityDriver | DriverInstaller<IdentityDriver>) {
    this.identityDriver = identity instanceof IdentityDriver ? identity : identity(this);

    return this;
  }

  storage() {
    return this.storageDriver;
  }

  setStorage(storage: StorageDriver | DriverInstaller<StorageDriver>) {
    this.storageDriver = storage instanceof StorageDriver ? storage : storage(this);

    return this;
  }

  nfts() {
    return new NftClient(this);
  }

  async sendTransaction(
    transaction: Transaction | TransactionBuilder,
    signers: Signer[] = [],
    sendOptions: SendOptions = {}
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

    return this.identity().sendTransaction(transaction, keypairs, sendOptions);
  }

  async confirmTransaction(
    signature: TransactionSignature,
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<SignatureResult>> {
    const rpcResponse = await this.connection.confirmTransaction(signature, commitment);

    if (rpcResponse.value.err) {
      // TODO: Custom errors.
      throw new Error(`Transaction ${signature} failed (${JSON.stringify(rpcResponse.value)})`);
    }

    return rpcResponse;
  }

  async sendAndConfirmTransaction(
    transaction: Transaction | TransactionBuilder,
    signers?: Signer[],
    confirmOptions?: ConfirmOptions
  ): Promise<TransactionSignature> {
    const signature = await this.sendTransaction(transaction, signers, confirmOptions);
    await this.confirmTransaction(signature, confirmOptions?.commitment);

    return signature;
  }

  async getAccountInfo(publicKey: PublicKey, commitment?: Commitment) {
    return this.connection.getAccountInfo(publicKey, commitment);
  }

  async getMultipleAccountsInfo(publicKeys: PublicKey[], commitment?: Commitment) {
    const accounts = await this.connection.getMultipleAccountsInfo(publicKeys, commitment);

    return accounts as Array<AccountInfo<Buffer> | null>;
  }
}
