import { UtilsClient } from './UtilsClient';
import type { Metaplex } from '@/Metaplex';

import { MetaplexPlugin } from '@/types';

/** @group Plugins */
export const utilsModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const utilsClient = new UtilsClient(metaplex);
    metaplex.utils = () => utilsClient;
  },
});

declare module '@metaplex-foundation/js-core/Metaplex' {
  interface Metaplex {
    utils(): UtilsClient;
  }
}
