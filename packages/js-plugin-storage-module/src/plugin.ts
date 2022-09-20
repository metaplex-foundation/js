import { StorageClient } from './StorageClient';
import type { Metaplex } from '@metaplex-foundation/js';

import { MetaplexPlugin } from '@metaplex-foundation/js';

/** @group Plugins */
export const storageModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const storageClient = new StorageClient();
    metaplex.storage = () => storageClient;
  },
});

declare module '@metaplex-foundation/js/Metaplex' {
  interface Metaplex {
    storage(): StorageClient;
  }
}
