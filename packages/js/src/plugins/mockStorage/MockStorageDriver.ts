import {
  MetaplexFile,
  StorageDriver,
} from '@metaplex-foundation/js-plugin-storage-module';
import {
  Amount,
  BigNumber,
  lamports,
  toBigNumber,
} from '@metaplex-foundation/js';
import { AssetNotFoundError } from '@metaplex-foundation/js';

const DEFAULT_BASE_URL = 'https://mockstorage.example.com/';
const DEFAULT_COST_PER_BYTE = 1;

export type MockStorageOptions = {
  baseUrl?: string;
  costPerByte?: BigNumber | number;
};

export class MockStorageDriver implements StorageDriver {
  private _cache: Record<string, MetaplexFile> = {};
  public readonly baseUrl: string;
  public readonly costPerByte: BigNumber;

  constructor(options?: MockStorageOptions) {
    this.baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
    this.costPerByte = toBigNumber(
      options?.costPerByte != null
        ? options?.costPerByte
        : DEFAULT_COST_PER_BYTE
    );
  }

  async getUploadPrice(bytes: number): Promise<Amount> {
    return lamports(this.costPerByte.muln(bytes));
  }

  async upload(file: MetaplexFile): Promise<string> {
    const uri = `${this.baseUrl}${file.uniqueName}`;
    this._cache[uri] = file;

    return uri;
  }

  async download(uri: string): Promise<MetaplexFile> {
    const file = this._cache[uri];

    if (!file) {
      throw new AssetNotFoundError(uri);
    }

    return file;
  }
}
