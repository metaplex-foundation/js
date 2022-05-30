import type { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { IdentityClient } from './IdentityClient';

export const storageModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const identityClient = new IdentityClient();
    metaplex.identity = () => identityClient;
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    identity(): IdentityClient;
  }
}
