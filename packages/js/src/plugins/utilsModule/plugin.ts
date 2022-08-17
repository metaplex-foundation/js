import type { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { UtilsClient } from './UtilsClient';

/** @group Plugins */
export const utilsModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const utilsClient = new UtilsClient(metaplex);
    metaplex.utils = () => utilsClient;
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    utils(): UtilsClient;
  }
}
