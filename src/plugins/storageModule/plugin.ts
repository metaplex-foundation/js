import type { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { StorageClient } from './StorageClient';

export const storageModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const storageClient = new StorageClient();
    metaplex.storage = () => storageClient;
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    storage(): StorageClient;
  }
}
