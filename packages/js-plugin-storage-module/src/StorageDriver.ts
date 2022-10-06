import { RequestInit } from 'node-fetch';
import { MetaplexFile } from './MetaplexFile';
import { Amount } from '@metaplex-foundation/js-core/types';

export type StorageDriver = {
  getUploadPrice: (bytes: number) => Promise<Amount>;
  upload: (file: MetaplexFile) => Promise<string>;
  uploadAll?: (files: MetaplexFile[]) => Promise<string[]>;
  download?: (
    uri: string,
    options?: StorageDownloadOptions
  ) => Promise<MetaplexFile>;
};

export type StorageDownloadOptions = RequestInit;
