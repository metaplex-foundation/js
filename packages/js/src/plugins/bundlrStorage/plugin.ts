import type { Metaplex, MetaplexPlugin } from '@metaplex-foundation/js-core';
import { BundlrOptions, BundlrUploader } from './BundlrUploader';

export const bundlrStorage = (options: BundlrOptions = {}): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.uploader = new BundlrUploader(metaplex, options);
  },
});
