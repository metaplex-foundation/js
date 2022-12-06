import type { Metaplex, MetaplexPlugin } from '@metaplex-foundation/js-core';
import { UtilsClient } from './UtilsClient';

/** @group Plugins */
export const utilsModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const utilsClient = new UtilsClient(metaplex);
    metaplex.utils = () => utilsClient;
  },
});

declare module '@metaplex-foundation/js-core/dist/types/Metaplex' {
  interface Metaplex {
    utils(): UtilsClient;
  }
}
