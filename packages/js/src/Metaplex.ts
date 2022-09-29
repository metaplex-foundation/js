import { Connection, Transaction } from '@solana/web3.js';
import { MetaplexPlugin, Cluster, resolveClusterFromConnection } from '@/types';
import { corePlugins } from '@/plugins/corePlugins';
import { TransactionBuilder } from '@/utils';

export type MetaplexOptions = {
  cluster?: Cluster;
  onSignature?: (signature: string, transaction: Transaction | TransactionBuilder) => Promise<void>;
};

export class Metaplex {
  /** The connection object from Solana's SDK. */
  public readonly connection: Connection;

  /** The cluster in which the connection endpoint belongs to. */
  public readonly cluster: Cluster;
  
  /** Callback when signature is generated */
  public readonly onSignature?: (signature: string, transaction: Transaction | TransactionBuilder) => Promise<void>;

  constructor(connection: Connection, options: MetaplexOptions = {}) {
    this.connection = connection;
    this.cluster = options.cluster ?? resolveClusterFromConnection(connection);
    if (options.onSignature && typeof options.onSignature === 'function') {
      this.onSignature = options.onSignature;
    }
    this.use(corePlugins());
  }

  static make(connection: Connection, options: MetaplexOptions = {}) {
    return new this(connection, options);
  }

  use(plugin: MetaplexPlugin) {
    plugin.install(this);

    return this;
  }
}
