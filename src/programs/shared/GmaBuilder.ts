import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import { MaybeAccountInfoWithPublicKey } from "./AccountInfoWithPublicKey";
import { chunk, LazyPipe, zipMap } from "@/utils";

export interface GmaBuilderOptions {
  chunkSize?: number;
}

export class GmaBuilder {
  protected readonly connection: Connection;
  protected readonly publicKeys: PublicKey[];
  protected chunkSize: number;

  constructor(connection: Connection, publicKeys: PublicKey[], options: GmaBuilderOptions = {}) {
    this.connection = connection;
    this.chunkSize = options.chunkSize ?? 100;
    this.publicKeys = publicKeys;
  }

  chunkBy(n: number) {
    this.chunkSize = n;

    return this;
  }

  addPublicKeys(publicKeys: PublicKey[]) {
    this.publicKeys.push(...publicKeys);

    return this;
  }

  getPublicKeys(): PublicKey[] {
    return this.publicKeys;
  }

  getUniquePublicKeys(): PublicKey[] {
    // TODO: Only send unique keys and reconciliate after call.
    return this.getPublicKeys();
  }

  async getFirst(n?: number): Promise<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    const end = this.boundNumber(n ?? 1);

    return this.getChunks(this.getPublicKeys().slice(0, end));
  }

  async getLast(n?: number): Promise<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    const start = this.boundNumber(n ?? 1);

    return this.getChunks(this.getPublicKeys().slice(- start));
  }

  async getBetween(start: number, end: number): Promise<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    start = this.boundNumber(start);
    end = this.boundNumber(end);
    [start, end] = start > end ? [end, start] : [start, end];

    return this.getChunks(this.getPublicKeys().slice(start, end));
  }

  async getPage(page: number, perPage: number): Promise<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    return this.getBetween((page - 1) * perPage, page * perPage);
  }

  async get(): Promise<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    return this.getChunks(this.getPublicKeys());
  }

  lazy(): LazyPipe<MaybeAccountInfoWithPublicKey<Buffer>[]> {
    return LazyPipe.make(async () => this.get());
  }

  async getAndMap<T>(callback: (account: MaybeAccountInfoWithPublicKey<Buffer>) => T): Promise<T[]> {
    return this.lazy()
      .map<MaybeAccountInfoWithPublicKey<Buffer>[], T>(callback)
      .run();
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
