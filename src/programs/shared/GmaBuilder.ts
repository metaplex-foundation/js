import { Connection, PublicKey } from "@solana/web3.js";
import { AccountInfoWithPublicKey } from "./AccountInfoWithPublicKey";

export interface GmaBuilderOptions {
  chunkSize?: number;
}

export class GmaBuilder {
  protected readonly connection: Connection;
  protected readonly publicKeys: PublicKey[];
  protected chunkSize: number;

  constructor(connection: Connection, publicKeys: PublicKey[], options: GmaBuilderOptions = {}) {
    this.connection = connection;
    this.publicKeys = publicKeys;
    this.chunkSize = options.chunkSize ?? 100;
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
    return [];
  }

  async getFirst(n?: number): Promise<AccountInfoWithPublicKey<Buffer>[]> {
    return [];
  }

  async getLast(n?: number): Promise<AccountInfoWithPublicKey<Buffer>[]> {
    return [];
  }

  async getBetween(start: number, end: number): Promise<AccountInfoWithPublicKey<Buffer>[]> {
    return [];
  }

  async getPage(page: number, perPage: number): Promise<AccountInfoWithPublicKey<Buffer>[]> {
    return [];
  }

  async get(): Promise<AccountInfoWithPublicKey<Buffer>[]> {
    return [];
  }
}
