import type { GenericAbortSignal } from './GenericAbortSignal';
import type { GenericFile } from './GenericFile';

export interface DownloaderInterface {
  download: (
    uris: string[],
    options: DownloaderOptions
  ) => Promise<GenericFile[]>;
}

export type DownloaderOptions = {
  onProgress?: (percent: number, ...args: any) => void;
  signal?: GenericAbortSignal;
};

export class NullDownloader implements DownloaderInterface {
  download(): Promise<GenericFile[]> {
    // TODO(loris): Custom error.
    throw Error('DownloaderInterface not implemented.');
  }
}
