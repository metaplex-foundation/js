import type {
  Metaplex as MetaplexType,
  MetaplexPlugin,
} from '@metaplex-foundation/js';
import { NftStorageDriver, NftStorageDriverOptions } from './NftStorageDriver';

export const nftStorage = (
  options: NftStorageDriverOptions = {}
): MetaplexPlugin => ({
  install(metaplex: MetaplexType) {
    metaplex.storage().setDriver(new NftStorageDriver(metaplex, options));
  },
});
