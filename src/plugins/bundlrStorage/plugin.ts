import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { BundlrOptions, BundlrStorageDriver } from './BundlrStorageDriver';

export const bundlrStorage = (options: BundlrOptions = {}): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.storage().setDriver(new BundlrStorageDriver(metaplex, options));
  },
});
