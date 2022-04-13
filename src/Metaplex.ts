import { Buffer } from 'buffer';
import {
  AccountInfo,
  Commitment,
  ConfirmOptions,
  Connection,
  PublicKey,
  RpcResponseAndContext,
  SendOptions,
  SignatureResult,
  Transaction,
  TransactionSignature,
  SendTransactionError,
  TransactionError,
} from '@solana/web3.js';
import { IdentityDriver, GuestIdentityDriver, StorageDriver, BundlrStorageDriver } from '@/drivers/index';
import {
  InputOfOperation,
  Operation,
  OperationConstructor,
  OperationHandler,
  OperationHandlerConstructor,
  OutputOfOperation,
  TransactionBuilder,
  Signer,
  getSignerHistogram,
} from '@/shared/index';
import { nftPlugin } from '@/modules/index';
import { MetaplexPlugin } from '@/MetaplexPlugin';

export type MetaplexOptions = {
  // ...
};

export class Metaplex {
  /** The connection object from Solana's SDK. */
  public readonly connection: Connection;

  /** Options that dictate how to interact with the Metaplex SDK. */
  public readonly options: MetaplexOptions;

  /** Encapsulates the identity of the users interacting with the SDK. */
  protected identityDriver: IdentityDriver;

  /** Encapsulates where assets should be uploaded. */
  protected storageDriver: StorageDriver;

  /** The registered handlers for read/write operations. */
  protected operationHandlers: Map<any, any> = new Map();

  constructor(connection: Connection, options: MetaplexOptions = {}) {
    this.connection = connection;
    this.options = options;
    this.identityDriver = new GuestIdentityDriver(this);
    this.storageDriver = new BundlrStorageDriver(this);
    this.registerDefaultPlugins();
  }

  static make(connection: Connection, options: MetaplexOptions = {}) {
    return new this(connection, options);
  }

  registerDefaultPlugins() {
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
    const rpcResponse: RpcResponseAndContext<SignatureResult> =
      await this.connection.confirmTransaction(signature, commitment);
    let transaction_error: TransactionError | null = rpcResponse.value.err;
    if (transaction_error) {
      // TODO: Custom errors.
      throw new SendTransactionError(
        `Transaction ${signature} failed (${JSON.stringify(transaction_error)})`,
        [transaction_error.toString()]
      );
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

  register<T extends Operation<I, O>, I = InputOfOperation<T>, O = OutputOfOperation<T>>(
    operation: OperationConstructor<I, O>,
    operationHandler: OperationHandlerConstructor<T, I, O>
  ) {
    this.operationHandlers.set(operation, operationHandler);

    return this;
  }

  getOperationHandler<T extends Operation<I, O>, I = InputOfOperation<T>, O = OutputOfOperation<T>>(
    operation: T
  ): OperationHandler<T, I, O> {
    const operationHandler = this.operationHandlers.get(operation.constructor) as
      | OperationHandlerConstructor<T, I, O>
      | undefined;

    if (!operationHandler) {
      // TODO: Custom errors.
      throw new Error(`No operation handler registered for ${operation.constructor.name}`);
    }

    return new operationHandler(this);
  }

  async execute<T extends Operation<I, O>, I = InputOfOperation<T>, O = OutputOfOperation<T>>(
    operation: T
  ): Promise<O> {
    const handler = this.getOperationHandler<T, I, O>(operation);

    return handler.handle(operation);
  }
}
