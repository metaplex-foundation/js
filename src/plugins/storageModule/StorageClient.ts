import { DriverNotProvidedError, InvalidJsonStringError } from '@/errors';
import { HasDriver, Amount } from '@/types';
import {
  MetaplexFile,
  useMetaplexFile,
  useMetaplexFileFromJson,
} from './MetaplexFile';
import { StorageDriver } from './StorageDriver';

export type StorageClient = HasDriver<StorageDriver> & {
  // Uploads.
  getUploadPriceForBytes: (bytes: number) => Promise<Amount>;
  getUploadPriceForFile: (file: MetaplexFile) => Promise<Amount>;
  getUploadPriceForFiles: (files: MetaplexFile[]) => Promise<Amount>;
  upload: (file: MetaplexFile) => Promise<string>;
  uploadAll: (files: MetaplexFile[]) => Promise<string[]>;
  uploadJson: <T extends object = object>(json: T) => Promise<string>;

  // Downloads.
  download: (uri: string, options?: RequestInit) => Promise<MetaplexFile>;
  downloadJson: <T extends object = object>(
    uri: string,
    options?: RequestInit
  ) => Promise<T>;
};

export class CoreStorageClient implements StorageClient {
  private _driver: StorageDriver | null = null;

  driver(): StorageDriver {
    if (!this._driver) {
      throw new DriverNotProvidedError('StorageDriver');
    }

    return this._driver;
  }

  setDriver(newDriver: StorageDriver): void {
    this._driver = newDriver;
  }

  getUploadPriceForBytes(bytes: number): Promise<Amount> {
    return this.driver().getUploadPrice(bytes);
  }

  getUploadPriceForFile(file: MetaplexFile): Promise<Amount> {
    return this.getUploadPriceForFiles([file]);
  }

  getUploadPriceForFiles(files: MetaplexFile[]): Promise<Amount> {
    const totalBytes = files.reduce(
      (acc: number, file: MetaplexFile) => acc + file.getBytes(),
      0
    );

    return this.getUploadPriceForBytes(totalBytes);
  }

  upload(file: MetaplexFile): Promise<string> {
    return this.driver().upload(file);
  }

  uploadAll(files: MetaplexFile[]): Promise<string[]> {
    const driver = this.driver();

    return driver.uploadAll
      ? driver.uploadAll(files)
      : Promise.all(files.map((file) => this.driver().upload(file)));
  }

  uploadJson<T extends object = object>(
    json: T,
    triggerEvents = true
  ): Promise<string> {
    return this.upload(useMetaplexFileFromJson<T>(json));
  }

  async download(uri: string, options?: RequestInit): Promise<MetaplexFile> {
    const driver = this.driver();

    if (driver.download) {
      return driver.download(uri, options);
    }

    const response = await fetch(uri, options);
    const buffer = await response.arrayBuffer();

    return useMetaplexFile(buffer, uri);
  }

  async downloadJson<T extends object = object>(
    uri: string,
    options?: RequestInit
  ): Promise<T> {
    const file = await this.download(uri, options);

    try {
      return JSON.parse(file.toString());
    } catch (error) {
      throw new InvalidJsonStringError(error as Error);
    }
  }
}
