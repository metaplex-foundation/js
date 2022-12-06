import type { Metaplex, MetaplexPlugin } from '@metaplex-foundation/js-core';
import { MockStorageDriver, MockStorageOptions } from './MockStorageDriver';

export const mockStorage = (options?: MockStorageOptions): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.storage().setDriver(new MockStorageDriver(options));
  },
});
