import { UtilsClient } from './UtilsClient';
import type { Metaplex as MetaplexType } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';

/** @group Plugins */
export const utilsModule = (): MetaplexPlugin => ({
  install(metaplex: MetaplexType) {
    const utilsClient = new UtilsClient(metaplex);
    metaplex.utils = () => utilsClient;
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    utils(): UtilsClient;
  }
}
