import { PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { UnparsedMaybeAccount } from '@/types';
import { Postpone } from './Postpone';
import { chunk } from './common';

export interface GmaBuilderOptions {
  chunkSize?: number;
}

export class GmaBuilder {
  protected readonly metaplex: Metaplex;
  protected readonly publicKeys: PublicKey[];
  protected chunkSize: number;

  constructor(
    metaplex: Metaplex,
    publicKeys: PublicKey[],
    options: GmaBuilderOptions = {}
  ) {
    this.metaplex = metaplex;
    this.chunkSize = options.chunkSize ?? 100;
    this.publicKeys = publicKeys;
  }

  static make(
    metaplex: Metaplex,
    publicKeys: PublicKey[],
    options: GmaBuilderOptions = {}
  ) {
    return new GmaBuilder(metaplex, publicKeys, options);
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

  async getFirst(n?: number): Promise<UnparsedMaybeAccount[]> {
    const end = this.boundNumber(n ?? 1);

    return this.getChunks(this.getPublicKeys().slice(0, end));
  }

  async getLast(n?: number): Promise<UnparsedMaybeAccount[]> {
    const start = this.boundNumber(n ?? 1);

    return this.getChunks(this.getPublicKeys().slice(-start));
  }

  async getBetween(
    start: number,
    end: number
  ): Promise<UnparsedMaybeAccount[]> {
    start = this.boundNumber(start);
    end = this.boundNumber(end);
    [start, end] = start > end ? [end, start] : [start, end];

    return this.getChunks(this.getPublicKeys().slice(start, end));
  }

  async getPage(
    page: number,
    perPage: number
  ): Promise<UnparsedMaybeAccount[]> {
    return this.getBetween((page - 1) * perPage, page * perPage);
  }

  async get(): Promise<UnparsedMaybeAccount[]> {
    return this.getChunks(this.getPublicKeys());
  }

  lazy(): Postpone<UnparsedMaybeAccount[]> {
    return Postpone.make(async () => this.get());
  }

  async getAndMap<T>(
    callback: (account: UnparsedMaybeAccount) => T
  ): Promise<T[]> {
    return this.lazy().map(callback).run();
  }

  protected async getChunks(
    publicKeys: PublicKey[]
  ): Promise<UnparsedMaybeAccount[]> {
    const chunks = chunk(publicKeys, this.chunkSize);
    const chunkPromises = chunks.map((chunk) => this.getChunk(chunk));
    const resolvedChunks = await Promise.allSettled(chunkPromises);

    return resolvedChunks.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : []
    );
  }

  protected async getChunk(
    publicKeys: PublicKey[]
  ): Promise<UnparsedMaybeAccount[]> {
    try {
      // TODO: Use lower level RPC call to add dataSlice support.
      return await this.metaplex.rpc().getMultipleAccounts(publicKeys);
    } catch (error) {
      // TODO: Throw error instead?
      return publicKeys.map((publicKey) => ({
        publicKey: publicKey,
        exists: false,
      }));
    }
  }

  protected boundNumber(n: number): number {
    return this.boundIndex(n - 1) + 1;
  }

  protected boundIndex(index: number): number {
    index = index < 0 ? 0 : index;
    index =
      index >= this.publicKeys.length ? this.publicKeys.length - 1 : index;

    return index;
  }
}
