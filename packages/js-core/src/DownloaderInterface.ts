import { GenericAbortSignal } from './GenericAbortSignal';
import { GenericFile } from './GenericFile';

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
