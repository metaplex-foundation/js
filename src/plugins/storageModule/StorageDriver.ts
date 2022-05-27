import { Amount } from '@/types';
import { MetaplexFile } from './MetaplexFile';

export type StorageDriver = {
  getUploadPrice: (bytes: number) => Promise<Amount>;
  upload: (file: MetaplexFile) => Promise<string>;
  uploadAll?: (files: MetaplexFile[]) => Promise<string[]>;
  download?: (uri: string, options?: RequestInit) => Promise<MetaplexFile>;
  beforeUpload?: (files: MetaplexFile[]) => Promise<void>;
  afterUpload?: (files: MetaplexFile[], uris: string[]) => Promise<void>;
};
