import BN from 'bn.js';
import { Amount, lamports } from '@/types';
import { AssetNotFoundError } from '@/errors';
import { MetaplexFile, StorageDriver } from '../storageModule';

const DEFAULT_BASE_URL = 'https://mockstorage.example.com/';
const DEFAULT_COST_PER_BYTE = new BN(1);

export type MockStorageOptions = {
  baseUrl?: string;
  costPerByte?: BN | number;
};

export class MockStorageDriver implements StorageDriver {
  private cache: Record<string, MetaplexFile> = {};
  public readonly baseUrl: string;
  public readonly costPerByte: BN;

  constructor(options?: MockStorageOptions) {
    this.baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
    this.costPerByte =
      options?.costPerByte != null
        ? new BN(options?.costPerByte)
        : DEFAULT_COST_PER_BYTE;
  }

  async getUploadPrice(bytes: number): Promise<Amount> {
    return lamports(this.costPerByte.muln(bytes));
  }

  async upload(file: MetaplexFile): Promise<string> {
    const uri = `${this.baseUrl}${file.uniqueName}`;
    this.cache[uri] = file;

    return uri;
  }

  async download(uri: string): Promise<MetaplexFile> {
    const file = this.cache[uri];

    if (!file) {
      throw new AssetNotFoundError(uri);
    }

    return file;
  }
}
