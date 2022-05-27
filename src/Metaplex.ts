import { Connection } from '@solana/web3.js';
import {
  MetaplexPlugin,
  Cluster,
  resolveClusterFromConnection,
  IdentityDriver,
  RpcDriver,
  ProgramDriver,
  OperationDriver,
} from '@/types';
import { GuestIdentityDriver } from '@/plugins/guestIdentity';
import { CoreRpcDriver } from '@/plugins/coreRpcDriver';
import { CoreProgramDriver } from '@/plugins/coreProgramDriver';
import { CoreOperationDriver } from '@/plugins/coreOperationDriver';
import { corePlugins } from '@/plugins/corePlugins';

export type MetaplexOptions = {
  cluster?: Cluster;
};

export class Metaplex {
  /** The connection object from Solana's SDK. */
  public readonly connection: Connection;

  /** The cluster in which the connection endpoint belongs to. */
  public readonly cluster: Cluster;

  /** Encapsulates the identity of the users interacting with the SDK. */
  protected identityDriver: IdentityDriver;

  /** Encapsulates how to read and write on-chain. */
  protected rpcDriver: RpcDriver;

  /** Registers all recognised programs across clusters. */
  protected programDriver: ProgramDriver;

  /** Registers handlers for read/write operations. */
  protected operationDriver: OperationDriver;

  constructor(connection: Connection, options: MetaplexOptions = {}) {
    this.connection = connection;
    this.cluster = options.cluster ?? resolveClusterFromConnection(connection);
    this.identityDriver = new GuestIdentityDriver(this);
    this.rpcDriver = new CoreRpcDriver(this);
    this.programDriver = new CoreProgramDriver(this);
    this.operationDriver = new CoreOperationDriver(this);
    this.use(corePlugins());
  }

  static make(connection: Connection, options: MetaplexOptions = {}) {
    return new this(connection, options);
  }

  use(plugin: MetaplexPlugin) {
    plugin.install(this);

    return this;
  }

  identity() {
    return this.identityDriver;
  }

  setIdentityDriver(identity: IdentityDriver) {
    this.identityDriver = identity;

    return this;
  }

  rpc() {
    return this.rpcDriver;
  }

  setRpcDriver(rpc: RpcDriver) {
    this.rpcDriver = rpc;

    return this;
  }

  programs() {
    return this.programDriver;
  }

  setProgramDriver(programDriver: ProgramDriver) {
    this.programDriver = programDriver;

    return this;
  }

  operations() {
    return this.operationDriver;
  }

  setOperationDriver(operationDriver: OperationDriver) {
    this.operationDriver = operationDriver;

    return this;
  }
}
