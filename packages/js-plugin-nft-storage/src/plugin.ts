import type { Metaplex, MetaplexPlugin } from '@metaplex-foundation/js';
import { NftStorageDriver } from './NftStorageDriver';

export const awsStorage = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.storage().setDriver(new NftStorageDriver());
  },
});
