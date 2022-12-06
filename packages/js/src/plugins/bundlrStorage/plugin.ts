import type { Metaplex, MetaplexPlugin } from '@metaplex-foundation/js-core';
import { BundlrOptions, BundlrStorageDriver } from './BundlrStorageDriver';

export const bundlrStorage = (options: BundlrOptions = {}): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.uploader = new BundlrStorageDriver(metaplex, options);
  },
});
