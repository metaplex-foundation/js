import BN from 'bn.js';
import { Metaplex } from '@/Metaplex';
import { MetaplexFile, StorageDriver } from '@/types';
import { SolAmount } from '@/utils';
import { AssetNotFoundError } from '@/errors';

const DEFAULT_BASE_URL = 'https://mockstorage.example.com/';
const DEFAULT_COST_PER_BYTE = new BN(1);

export interface MockStorageOptions {
  baseUrl?: string;
  costPerByte?: BN | number;
}

export class MockStorageDriver extends StorageDriver {
  private cache: Record<string, MetaplexFile> = {};
  public readonly baseUrl: string;
  public readonly costPerByte: BN;

  constructor(metaplex: Metaplex, options?: MockStorageOptions) {
    super(metaplex);
    this.baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
    this.costPerByte =
      options?.costPerByte != null ? new BN(options?.costPerByte) : DEFAULT_COST_PER_BYTE;
  }

  public async getPrice(...files: MetaplexFile[]): Promise<SolAmount> {
    const bytes = files.reduce((total, file) => total + file.toBuffer().byteLength, 0);

    return SolAmount.fromLamports(bytes).multipliedBy(this.costPerByte);
  }

  public async upload(file: MetaplexFile): Promise<string> {
    const uri = `${this.baseUrl}${file.uniqueName}`;
    this.cache[uri] = file;

    return uri;
  }

  public async download(uri: string): Promise<MetaplexFile> {
    const file = this.cache[uri];

    if (!file) {
      throw new AssetNotFoundError(uri);
    }

    return file;
  }

  public async downloadJson<T extends object>(uri: string): Promise<T> {
    const file = await this.download(uri);

    return JSON.parse(file.toString());
  }
}
