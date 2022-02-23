import { AccountInfo, Commitment, Connection, PublicKey, SendOptions, Signer, Transaction } from "@solana/web3.js";
import { TransactionBuilder } from "@/utils";

export interface MetaplexOptions {
  // wallet?: MetaplexWallet,
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

  constructor(connection: Connection, options: MetaplexOptions = {}) {
    this.connection = connection;
    this.options = options;
  }

  async sendTransaction(tx: Transaction | TransactionBuilder, signers: Signer[] = [], sendOptions: SendOptions = {}): Promise<string> {
    if (tx instanceof TransactionBuilder) {
      return tx.sendTransaction(this.connection, signers, sendOptions);
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
