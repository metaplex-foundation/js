import BN from 'bn.js';
import { Metaplex } from '@/Metaplex';
import { MetaplexFile } from '../filesystem/MetaplexFile';
import { StorageDriver } from './StorageDriver';

export const mockStorage = () => (metaplex: Metaplex) => new mockStorageDriver(metaplex);

export class mockStorageDriver extends StorageDriver {
  private cache: Record<string, MetaplexFile> = {};

  public async getPrice(_file: MetaplexFile): Promise<BN> {
    return new BN(0);
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
