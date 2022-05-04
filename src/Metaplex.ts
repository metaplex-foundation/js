import { Connection } from '@solana/web3.js';
import {
  IdentityDriver,
  GuestIdentityDriver,
  StorageDriver,
  BundlrStorageDriver,
  RpcDriver,
  Web3RpcDriver,
  ProgramDriver,
  ArrayProgramDriver,
  coreProgramsPlugin,
  OperationDriver,
  MapOperationDriver,
} from '@/drivers';
import { Cluster, resolveClusterFromConnection } from '@/shared';
import { nftPlugin } from '@/modules';
import { MetaplexPlugin } from '@/MetaplexPlugin';

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

  /** Encapsulates where assets should be uploaded. */
  protected storageDriver: StorageDriver;

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
    this.storageDriver = new BundlrStorageDriver(this);
    this.rpcDriver = new Web3RpcDriver(this);
    this.programDriver = new ArrayProgramDriver(this);
    this.operationDriver = new MapOperationDriver(this);
    this.registerDefaultPlugins();
  }

  static make(connection: Connection, options: MetaplexOptions = {}) {
    return new this(connection, options);
  }

  registerDefaultPlugins() {
    this.use(coreProgramsPlugin);
    this.use(nftPlugin());
  }

  use(plugin: MetaplexPlugin) {
    plugin.install(this);

    return this;
  }

  identity() {
    return this.identityDriver;
  }

  setIdentity(identity: IdentityDriver) {
    this.identityDriver = identity;

    return this;
  }

  storage() {
    return this.storageDriver;
  }

  setStorage(storage: StorageDriver) {
    this.storageDriver = storage;

    return this;
  }

  rpc() {
    return this.rpcDriver;
  }

  setRpc(rpc: RpcDriver) {
    this.rpcDriver = rpc;

    return this;
  }

  programs() {
    return this.programDriver;
  }

  setPrograms(programDriver: ProgramDriver) {
    this.programDriver = programDriver;

    return this;
  }

  operations() {
    return this.operationDriver;
  }

  setOperations(operationDriver: OperationDriver) {
    this.operationDriver = operationDriver;

    return this;
  }
}
