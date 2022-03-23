import BN from 'bn.js';
import { Metaplex } from '@/Metaplex';
import { MetaplexFile } from '../filesystem/MetaplexFile';
import { StorageDriver } from './StorageDriver';

const DEFAULT_COST_PER_BYTE = new BN(1);

export const mockStorage = (costPerByte?: BN | number) => (metaplex: Metaplex) =>
  new mockStorageDriver(metaplex, costPerByte != null ? new BN(costPerByte) : undefined);

export class mockStorageDriver extends StorageDriver {
  private cache: Record<string, MetaplexFile> = {};

  constructor(metaplex: Metaplex, readonly costPerByte = DEFAULT_COST_PER_BYTE) {
    super(metaplex);
  }

  public async getPrice(file: MetaplexFile): Promise<BN> {
    return new BN(file.buffer.byteLength).mul(this.costPerByte);
  }

  public async upload(file: MetaplexFile): Promise<string> {
    const uri = `https://mockstorage.example.com/${file.uniqueName}`;
    this.cache[uri] = file;

    return uri;
  }

  public async download(uri: string): Promise<MetaplexFile> {
    const file = this.cache[uri];

    if (!file) {
      throw new Error(`File not found at ${uri}.`);
    }

    return file;
  }

  public async downloadJson<T extends object>(uri: string): Promise<T> {
    const file = await this.download(uri);

    return JSON.parse(file.toString());
  }
}
