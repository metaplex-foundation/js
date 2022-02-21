import { AccountInfo, Connection, GetProgramAccountsConfig, GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";
import base58 from "bs58";
import BN from "bn.js";

export type AccountInfoWithPublicKey<T> = {
  pubkey: PublicKey;
  account: AccountInfo<T>;
}

export type GpaSortCallback = (
  a: AccountInfoWithPublicKey<Buffer>,
  b: AccountInfoWithPublicKey<Buffer>
) => number

export class GpaBuilder {

  /** The connection instance to use when fetching accounts. */
  private readonly connection: Connection;

  /** The public key of the program we want to retrieve accounts from. */
  private readonly programId: PublicKey;

  /** The configs to use when fetching program accounts. */
  private config: GetProgramAccountsConfig = {};

  /** When provided, reorder accounts using this callback. */
  private sortCallback?: GpaSortCallback;

  constructor(connection: Connection, programId: PublicKey) {
    this.connection = connection;
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

  where(offset: number, bytes: string | Buffer | PublicKey | BN) {
    if (bytes instanceof Buffer) {
      bytes = base58.encode(bytes);
    } else if (bytes instanceof PublicKey) {
      bytes = bytes.toBase58();
    } else if (bytes instanceof BN) {
      bytes = base58.encode(bytes.toArray());
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
    const accounts = await this.connection.getProgramAccounts(this.programId, this.config);

    if (this.sortCallback) {
      accounts.sort(this.sortCallback)
    }

    return accounts;
  }

  async getPublicKeys(): Promise<PublicKey[]> {
    return (await this.get()).map(account => account.pubkey);
  }
}
