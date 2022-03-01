import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import { MaybeAccountInfoWithPublicKey } from "./AccountInfoWithPublicKey";
import { chunk, zipMap } from "@/utils";

export interface GmaBuilderOptions {
  chunkSize?: number;
}

export class GmaBuilder {
  protected readonly connection: Connection;
  protected readonly publicKeys: PublicKey[];
  protected promise: Promise<PublicKey[]> | null;
  protected chunkSize: number;

  constructor(connection: Connection, publicKeys: PublicKey[] | Promise<PublicKey[]>, options: GmaBuilderOptions = {}) {
    this.connection = connection;
    this.chunkSize = options.chunkSize ?? 100;

    if (publicKeys instanceof Promise) {
      this.publicKeys = [];
      this.promise = publicKeys;
    } else {
      this.publicKeys = publicKeys;
      this.promise = null;
    }
  }

  chunkBy(n: number) {
    this.chunkSize = n;

    return this;
  }

  addPublicKeys(publicKeys: PublicKey[]) {
    this.publicKeys.push(...publicKeys);

    return this;
  }

  async getPublicKeys(): Promise<PublicKey[]> {
    if (this.promise) {
      this.addPublicKeys(await this.promise);
      this.promise = null;
    }

    return this.publicKeys;
  }

  async getUniquePublicKeys(): Promise<PublicKey[]> {
    // TODO: Only send unique keys and reconciliate after call.
    return this.getPublicKeys();
  }

  async getFirst(n?: number): Promise<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    const end = this.boundNumber(n ?? 1);
    const publicKeys = await this.getPublicKeys();

    return this.getChunks(publicKeys.slice(0, end));
  }

  async getLast(n?: number): Promise<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    const start = this.boundNumber(n ?? 1);
    const publicKeys = await this.getPublicKeys();

    return this.getChunks(publicKeys.slice(- start));
  }

  async getBetween(start: number, end: number): Promise<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    start = this.boundNumber(start);
    end = this.boundNumber(end);
    [start, end] = start > end ? [end, start] : [start, end];
    const publicKeys = await this.getPublicKeys();

    return this.getChunks(publicKeys.slice(start, end));
  }

  async getPage(page: number, perPage: number): Promise<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    return this.getBetween((page - 1) * perPage, page * perPage);
  }

  async get(): Promise<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    return this.getChunks(await this.getPublicKeys());
  }

  async getAndMap<T>(callback: (account: MaybeAccountInfoWithPublicKey<Buffer>) => T): Promise<T[]> {
    return (await this.get()).map(callback);
  }

  getMultipleAccounts(
    callback?: (account: MaybeAccountInfoWithPublicKey<Buffer>) => PublicKey | null,
    options?: GmaBuilderOptions,
  ): GmaBuilder {
    callback = callback ?? (account => account.exists ? new PublicKey(account.data) : null);
    options = options ?? { chunkSize: this.chunkSize };

    return new GmaBuilder(this.connection, this.getAndMap(callback), options);
  }

  protected async getChunks(publicKeys: PublicKey[]): Promise<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    const chunks = chunk(publicKeys, this.chunkSize);
    const chunkPromises = chunks.map(chunk => this.getChunk(chunk));
    const resolvedChunks = await Promise.allSettled(chunkPromises);

    return resolvedChunks.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  }

  protected async getChunk(publicKeys: PublicKey[]): Promise<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    try {
      // TODO: Use lower level RPC call to add dataSlice support.
      const accounts = (await this.connection.getMultipleAccountsInfo(publicKeys)) as (AccountInfo<Buffer> | null)[];

      return zipMap(publicKeys, accounts, (publicKey, account) => {
        return !account
          ? { pubkey: publicKey, exists: false }
          : { pubkey: publicKey, exists: true, ...account };
      });
    } catch (error) {
      // TODO: Throw error instead?
      return publicKeys.map(publicKey => ({ pubkey: publicKey, exists: false }));
    }
  }

  protected boundNumber(n: number): number {
    return this.boundIndex(n - 1) + 1;
  }

  protected boundIndex(index: number): number {
    index = index < 0 ? 0 : index;
    index = index >= this.publicKeys.length ? this.publicKeys.length - 1 : index;

    return index;
  }
}
