import type { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { StorageClient, useStorageClient } from './StorageClient';

export const storageModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const storageClient = useStorageClient();
    metaplex.storage = () => storageClient;
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    storage(): StorageClient;
  }
}
