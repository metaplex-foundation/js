import BN from 'bn.js';
import { Amount, useLamports } from '@/types';
import { AssetNotFoundError } from '@/errors';
import { MetaplexFile, StorageDriver } from '../storageModule';

const DEFAULT_BASE_URL = 'https://mockstorage.example.com/';
const DEFAULT_COST_PER_BYTE = new BN(1);

export type MockStorageOptions = {
  baseUrl?: string;
  costPerByte?: BN | number;
};

export const useMockStorageDriver = (
  options?: MockStorageOptions
): StorageDriver => {
  const cache: Record<string, MetaplexFile> = {};
  const baseUrl: string = options?.baseUrl ?? DEFAULT_BASE_URL;
  const costPerByte: BN =
    options?.costPerByte != null
      ? new BN(options?.costPerByte)
      : DEFAULT_COST_PER_BYTE;

  return {
    getUploadPrice: async (bytes: number): Promise<Amount> => {
      return useLamports(costPerByte.muln(bytes));
    },

    upload: async (file: MetaplexFile): Promise<string> => {
      const uri = `${baseUrl}${file.uniqueName}`;
      cache[uri] = file;

      return uri;
    },

    download: async (uri: string): Promise<MetaplexFile> => {
      const file = cache[uri];

      if (!file) {
        throw new AssetNotFoundError(uri);
      }

      return file;
    },
  };
};
