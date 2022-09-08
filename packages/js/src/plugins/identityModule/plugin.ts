import { IdentityClient } from './IdentityClient';
import type { Metaplex as MetaplexType } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';

/** @group Plugins */
export const identityModule = (): MetaplexPlugin => ({
  install(metaplex: MetaplexType) {
    const identityClient = new IdentityClient();
    metaplex.identity = () => identityClient;
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    identity(): IdentityClient;
  }
}
