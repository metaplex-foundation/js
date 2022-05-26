import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { useMockStorageDriver, MockStorageOptions } from './MockStorageDriver';

export const mockStorage = (options?: MockStorageOptions): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.storage().setDriver(useMockStorageDriver(options));
  },
});
