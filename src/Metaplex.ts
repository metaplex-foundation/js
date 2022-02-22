import { Connection } from "@solana/web3.js";

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
}
