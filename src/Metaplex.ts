import { AccountInfo, Commitment, Connection, PublicKey, SendOptions, Signer, Transaction, TransactionSignature } from "@solana/web3.js";
import { TransactionBuilder } from "@/programs/shared";
import { IdentityDriver, GuestIdentityDriver } from "@/drivers";

export interface MetaplexOptions {
  identity?: IdentityDriver,
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
    this.identityDriver = options.identity ?? new GuestIdentityDriver();
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

  async sendTransaction(
    tx: Transaction | TransactionBuilder,
    signers: Signer[] = [],
    sendOptions: SendOptions = {},
  ): Promise<TransactionSignature> {
    const identities = [this.identity()];

    if (tx instanceof TransactionBuilder) {
      const signerHistogram = tx.getSigners();
      signers = [...signerHistogram.keypairs, ...signers];
      identities.push(...signerHistogram.identities);
      tx = tx.toTransaction();
    }

    for (let i = 0; i < identities.length; i++) {
      await identities[i].signTransaction(tx);
    }
    
    return this.connection.sendTransaction(tx, signers, sendOptions)
  }

  async getAccountInfo(publicKey: PublicKey, commitment?: Commitment) {
    return this.connection.getAccountInfo(publicKey, commitment)
  }

  async getMultipleAccountsInfo(publicKeys: PublicKey[], commitment?: Commitment) {
    const accounts = await this.connection.getMultipleAccountsInfo(publicKeys, commitment);
    
    return accounts as Array<AccountInfo<Buffer> | null>;
  }
}
