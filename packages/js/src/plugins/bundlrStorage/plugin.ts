import { BundlrOptions, BundlrStorageDriver } from './BundlrStorageDriver';
import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@metaplex-foundation/js-core';

export const bundlrStorage = (options: BundlrOptions = {}): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.storage().setDriver(new BundlrStorageDriver(metaplex, options));
  },
});
