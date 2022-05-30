import { Connection } from '@solana/web3.js';
import {
  MetaplexPlugin,
  Cluster,
  resolveClusterFromConnection,
  ProgramDriver,
} from '@/types';
import { CoreProgramDriver } from '@/plugins/coreProgramDriver';
import { corePlugins } from '@/plugins/corePlugins';

export type MetaplexOptions = {
  cluster?: Cluster;
};

export class Metaplex {
  /** The connection object from Solana's SDK. */
  public readonly connection: Connection;

  /** The cluster in which the connection endpoint belongs to. */
  public readonly cluster: Cluster;

  /** Registers all recognised programs across clusters. */
  protected programDriver: ProgramDriver;

  constructor(connection: Connection, options: MetaplexOptions = {}) {
    this.connection = connection;
    this.cluster = options.cluster ?? resolveClusterFromConnection(connection);
    this.programDriver = new CoreProgramDriver(this);
    this.use(corePlugins());
  }

  static make(connection: Connection, options: MetaplexOptions = {}) {
    return new this(connection, options);
  }

  use(plugin: MetaplexPlugin) {
    plugin.install(this);

    return this;
  }

  programs() {
    return this.programDriver;
  }

  setProgramDriver(programDriver: ProgramDriver) {
    this.programDriver = programDriver;

    return this;
  }
}
