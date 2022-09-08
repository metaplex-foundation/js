import { DerivedIdentityClient } from './DerivedIdentityClient';
import type { Metaplex as MetaplexType } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';

/** @group Plugins */
export const derivedIdentity = (): MetaplexPlugin => ({
  install(metaplex: MetaplexType) {
    const derivedIdentityClient = new DerivedIdentityClient(metaplex);
    metaplex.derivedIdentity = () => derivedIdentityClient;
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    derivedIdentity(): DerivedIdentityClient;
  }
}
