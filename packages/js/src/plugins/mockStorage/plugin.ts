import { MockStorageDriver, MockStorageOptions } from './MockStorageDriver';
import { Metaplex as MetaplexType } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';

export const mockStorage = (options?: MockStorageOptions): MetaplexPlugin => ({
  install(metaplex: MetaplexType) {
    metaplex.storage().setDriver(new MockStorageDriver(options));
  },
});
