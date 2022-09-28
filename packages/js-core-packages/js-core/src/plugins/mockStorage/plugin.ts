import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { MockStorageDriver, MockStorageOptions } from './MockStorageDriver';

export const mockStorage = (options?: MockStorageOptions): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.storage().setDriver(new MockStorageDriver(options));
  },
});
