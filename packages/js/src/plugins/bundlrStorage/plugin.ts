import { BundlrOptions, BundlrStorageDriver } from './BundlrStorageDriver';
import { Metaplex as MetaplexType } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';

export const bundlrStorage = (options: BundlrOptions = {}): MetaplexPlugin => ({
  install(metaplex: MetaplexType) {
    metaplex.storage().setDriver(new BundlrStorageDriver(metaplex, options));
  },
});
