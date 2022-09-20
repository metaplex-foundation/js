import { AbortSignal } from 'abort-controller';
import { MetaplexFile } from './MetaplexFile';
import { Amount } from '@metaplex-foundation/js';

export type StorageDriver = {
  getUploadPrice: (bytes: number) => Promise<Amount>;
  upload: (file: MetaplexFile) => Promise<string>;
  uploadAll?: (files: MetaplexFile[]) => Promise<string[]>;
  download?: (
    uri: string,
    options?: StorageDownloadOptions
  ) => Promise<MetaplexFile>;
};

export type StorageDownloadOptions = Omit<RequestInit, 'signal'> & {
  signal?: AbortSignal | null;
};
