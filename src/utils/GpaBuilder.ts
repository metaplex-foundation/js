import {
  GetProgramAccountsConfig,
  GetProgramAccountsFilter,
  PublicKey,
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import base58 from 'bs58';
import BN from 'bn.js';
import { Metaplex } from '@/Metaplex';
import { UnparsedAccount } from '@/types';
import { GmaBuilder, GmaBuilderOptions } from './GmaBuilder';
import { Postpone } from './Postpone';

export type GpaSortCallback = (
  a: UnparsedAccount,
  b: UnparsedAccount
) => number;

export class GpaBuilder {
  /** The connection instance to use when fetching accounts. */
  protected readonly metaplex: Metaplex;

  /** The public key of the program we want to retrieve accounts from. */
  protected readonly programId: PublicKey;

  /** The configs to use when fetching program accounts. */
  protected config: GetProgramAccountsConfig = {};

  /** When provided, reorder accounts using this callback. */
  protected sortCallback?: GpaSortCallback;

  constructor(metaplex: Metaplex, programId: PublicKey) {
    this.metaplex = metaplex;
    this.programId = programId;
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

  async get(): Promise<UnparsedAccount[]> {
    const accounts = await this.metaplex
      .rpc()
      .getProgramAccounts(this.programId, this.config);

    if (this.sortCallback) {
      accounts.sort(this.sortCallback);
    }

    return accounts;
  }

  lazy(): Postpone<UnparsedAccount[]> {
    return Postpone.make(() => this.get());
  }

  async getAndMap<T>(callback: (account: UnparsedAccount) => T): Promise<T[]> {
    return this.lazy().map(callback).run();
  }

  async getPublicKeys(): Promise<PublicKey[]> {
    return this.getAndMap((account) => account.publicKey);
  }

  async getDataAsPublicKeys(): Promise<PublicKey[]> {
    return this.getAndMap((account) => new PublicKey(account.data));
  }

  getMultipleAccounts(
    callback?: (account: UnparsedAccount) => PublicKey,
    options?: GmaBuilderOptions
  ): Postpone<GmaBuilder> {
    const cb = callback ?? ((account) => new PublicKey(account.data));

    return Postpone.make(async () => {
      return new GmaBuilder(this.metaplex, await this.getAndMap(cb), options);
    });
  }
}
