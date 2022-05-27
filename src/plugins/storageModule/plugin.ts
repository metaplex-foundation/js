import type { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { StorageClient, CoreStorageClient } from './StorageClient';

export const storageModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const storageClient = new CoreStorageClient();
    metaplex.storage = () => storageClient;
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    storage(): StorageClient;
  }
}
