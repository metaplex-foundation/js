import { UtilsClient } from './UtilsClient';
import type { Metaplex } from '@metaplex-foundation/js';

import { MetaplexPlugin } from '@metaplex-foundation/js';

/** @group Plugins */
export const utilsModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const utilsClient = new UtilsClient(metaplex);
    metaplex.utils = () => utilsClient;
  },
});

declare module '@metaplex-foundation/js/Metaplex' {
  interface Metaplex {
    utils(): UtilsClient;
  }
}
