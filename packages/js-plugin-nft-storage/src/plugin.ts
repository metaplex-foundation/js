import type { Metaplex, MetaplexPlugin } from '@metaplex-foundation/js';
import { NftStorageDriver, NftStorageDriverOptions } from './NftStorageDriver';

export const nftStorage = (
  options: NftStorageDriverOptions = {}
): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.storage().setDriver(new NftStorageDriver(metaplex, options));
  },
});
