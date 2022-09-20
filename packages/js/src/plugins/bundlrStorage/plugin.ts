import { BundlrOptions, BundlrStorageDriver } from './BundlrStorageDriver';
import { Metaplex } from '@metaplex-foundation/js/Metaplex';
import { MetaplexPlugin } from '@metaplex-foundation/js';

export const bundlrStorage = (options: BundlrOptions = {}): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.storage().setDriver(new BundlrStorageDriver(metaplex, options));
  },
});
