import type { Metaplex, MetaplexPlugin } from '@metaplex-foundation/js-core';
import { DerivedIdentityClient } from './DerivedIdentityClient';

/** @group Plugins */
export const derivedIdentity = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const derivedIdentityClient = new DerivedIdentityClient(metaplex);
    metaplex.derivedIdentity = () => derivedIdentityClient;
  },
});

declare module '@metaplex-foundation/js-core/dist/types/Metaplex' {
  interface Metaplex {
    derivedIdentity(): DerivedIdentityClient;
  }
}
