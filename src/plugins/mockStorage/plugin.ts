import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { MockStorageDriver, MockStorageOptions } from './MockStorageDriver';

export const mockStorage = (options?: MockStorageOptions): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.setStorageDriver(new MockStorageDriver(metaplex, options));
  },
});
