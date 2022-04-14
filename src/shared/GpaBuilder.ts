import {
  Connection,
  GetProgramAccountsConfig,
  GetProgramAccountsFilter,
  PublicKey,
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import base58 from 'bs58';
import BN from 'bn.js';
import { AccountInfoWithPublicKey } from './AccountInfoWithPublicKey.js';
import { GmaBuilder, GmaBuilderOptions } from './GmaBuilder.js';
import { Postpone } from './Postpone.js';

export type GpaSortCallback = (
  a: AccountInfoWithPublicKey<Buffer>,
  b: AccountInfoWithPublicKey<Buffer>
) => number;

export class GpaBuilder {
  /** The connection instance to use when fetching accounts. */
  protected readonly connection: Connection;

  /** The public key of the program we want to retrieve accounts from. */
  protected readonly programId: PublicKey;

  /** The configs to use when fetching program accounts. */
  protected config: GetProgramAccountsConfig = {};

  /** When provided, reorder accounts using this callback. */
  protected sortCallback?: GpaSortCallback;

  constructor(connection: Connection, programId: PublicKey) {
    this.connection = connection;
    this.programId = programId;
  }

  static from<T extends typeof GpaBuilder>(this: T, builder: GpaBuilder): InstanceType<T> {
    const newBuilder = new this(builder.connection, builder.programId) as InstanceType<T>;
    newBuilder.mergeConfig(builder.config);
    newBuilder.sortCallback = builder.sortCallback;

    return newBuilder;
  }

  mergeConfig(config: GetProgramAccountsConfig) {
    this.config = { ...this.config, ...config };

    return this;
  }

  slice(offset: number, length: number) {
    this.config.dataSlice = { offset, length };

    return this;
  }

  withoutData() {
    return this.slice(0, 0);
  }

  addFilter(...filters: GetProgramAccountsFilter[]) {
    if (!this.config.filters) {
      this.config.filters = [];
    }

    this.config.filters.push(...filters);

    return this;
  }

  where(offset: number, bytes: string | Buffer | PublicKey | BN | number) {
    if (bytes instanceof Buffer) {
      bytes = base58.encode(bytes);
    } else if (bytes instanceof PublicKey) {
      bytes = bytes.toBase58();
    } else if (bytes instanceof BN) {
      bytes = base58.encode(bytes.toArray());
    } else if (typeof bytes !== 'string') {
      bytes = base58.encode(new BN(bytes, 'le').toArray());
    }

    return this.addFilter({ memcmp: { offset, bytes } });
  }

  whereSize(dataSize: number) {
    return this.addFilter({ dataSize });
  }

  sortUsing(callback: GpaSortCallback) {
    this.sortCallback = callback;

    return this;
  }

  async get(): Promise<AccountInfoWithPublicKey<Buffer>[]> {
    const rawAccounts = await this.connection.getProgramAccounts(this.programId, this.config);
    const accounts = rawAccounts.map(({ pubkey, account }) => ({
      pubkey,
      ...account,
    }));

    if (this.sortCallback) {
      accounts.sort(this.sortCallback);
    }

    return accounts;
  }

  lazy(): Postpone<AccountInfoWithPublicKey<Buffer>[]> {
    return Postpone.make(() => this.get());
  }

  async getAndMap<T>(callback: (account: AccountInfoWithPublicKey<Buffer>) => T): Promise<T[]> {
    return this.lazy().map(callback).run();
  }

  async getPublicKeys(): Promise<PublicKey[]> {
    return this.getAndMap((account) => account.pubkey);
  }

  async getDataAsPublicKeys(): Promise<PublicKey[]> {
    return this.getAndMap((account) => new PublicKey(account.data));
  }

  getMultipleAccounts(
    callback?: (account: AccountInfoWithPublicKey<Buffer>) => PublicKey,
    options?: GmaBuilderOptions
  ): Postpone<GmaBuilder> {
    const cb = callback ?? ((account) => new PublicKey(account.data));

    return Postpone.make(async () => {
      return new GmaBuilder(this.connection, await this.getAndMap(cb), options);
    });
  }
}
