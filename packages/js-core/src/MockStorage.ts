import type { DownloaderInterface } from './DownloaderInterface';
import { AssetNotFoundError } from './errors';
import type { GenericFile } from './GenericFile';
import type { Metaplex } from './Metaplex';
import type { MetaplexPlugin } from './MetaplexPlugin';
import type { UploaderInterface } from './UploaderInterface';

const DEFAULT_BASE_URL = 'https://mockstorage.example.com/';

export type MockStorageOptions = {
  baseUrl?: string;
};

export class MockStorage implements UploaderInterface, DownloaderInterface {
  protected cache: Record<string, GenericFile> = {};
  public readonly baseUrl: string;

  constructor(options?: MockStorageOptions) {
    this.baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
  }

  async uploadOne(file: GenericFile): Promise<string> {
    const uri = `${this.baseUrl}${file.uniqueName}`;
    this.cache[uri] = file;

    return uri;
  }

  async upload(files: GenericFile[]): Promise<string[]> {
    return Promise.all(files.map((file) => this.uploadOne(file)));
  }

  async download(uris: string[]): Promise<GenericFile[]> {
    return Promise.all(uris.map((uri) => this.downloadOne(uri)));
  }

  async downloadOne(uri: string): Promise<GenericFile> {
    const file = this.cache[uri];

    if (!file) {
      throw new AssetNotFoundError(uri);
    }

    return file;
  }
}

export const mockStorage = (options?: MockStorageOptions): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const mockStorage = new MockStorage(options);
    metaplex.uploader = mockStorage;
    metaplex.downloader = mockStorage;
  },
});
