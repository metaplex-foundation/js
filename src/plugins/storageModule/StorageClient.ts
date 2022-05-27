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
  upload: (file: MetaplexFile, triggerEvents?: boolean) => Promise<string>;
  uploadAll: (
    files: MetaplexFile[],
    triggerEvents?: boolean
  ) => Promise<string[]>;
  uploadJson: <T extends object = object>(
    json: T,
    triggerEvents?: boolean
  ) => Promise<string>;

  // UploadEvents.
  triggerBeforeUpload(files: MetaplexFile[]): Promise<void>;
  triggerAfterUpload(files: MetaplexFile[], uris: string[]): Promise<void>;

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

  async upload(file: MetaplexFile, triggerEvents = true): Promise<string> {
    if (triggerEvents) {
      this.triggerBeforeUpload([file]);
    }

    const uri = await this.driver().upload(file);

    if (triggerEvents) {
      this.triggerAfterUpload([file], [uri]);
    }

    return uri;
  }

  async uploadAll(
    files: MetaplexFile[],
    triggerEvents = true
  ): Promise<string[]> {
    if (triggerEvents) {
      this.triggerBeforeUpload(files);
    }

    const uploadAll = this.driver().uploadAll;
    const uris = uploadAll
      ? await uploadAll(files)
      : await Promise.all(files.map((file) => this.upload(file)));

    if (triggerEvents) {
      this.triggerAfterUpload(files, uris);
    }

    return uris;
  }

  async triggerBeforeUpload(files: MetaplexFile[]): Promise<void> {
    const beforeUpload = this.driver().beforeUpload;

    if (beforeUpload) {
      await beforeUpload(files);
    }
  }

  async triggerAfterUpload(
    files: MetaplexFile[],
    uris: string[]
  ): Promise<void> {
    const afterUpload = this.driver().afterUpload;

    if (afterUpload) {
      await afterUpload(files, uris);
    }
  }

  uploadJson<T extends object = object>(
    json: T,
    triggerEvents = true
  ): Promise<string> {
    return this.upload(useMetaplexFileFromJson<T>(json), triggerEvents);
  }

  async download(uri: string, options?: RequestInit): Promise<MetaplexFile> {
    const download = this.driver().download;

    if (download) {
      return download(uri, options);
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
