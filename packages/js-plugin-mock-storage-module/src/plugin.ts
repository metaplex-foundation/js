import { MockStorageDriver, MockStorageOptions } from './MockStorageDriver';
import { Metaplex } from '@metaplex-foundation/js-core/Metaplex';
import { MetaplexPlugin } from '@metaplex-foundation/js-core';

export const mockStorage = (options?: MockStorageOptions): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.storage().setDriver(new MockStorageDriver(options));
  },
});
