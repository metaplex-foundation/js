import { DerivedIdentityClient } from './DerivedIdentityClient';
import type { Metaplex } from '@metaplex-foundation/js';

import { MetaplexPlugin } from '@metaplex-foundation/js';

/** @group Plugins */
export const derivedIdentity = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const derivedIdentityClient = new DerivedIdentityClient(metaplex);
    metaplex.derivedIdentity = () => derivedIdentityClient;
  },
});

declare module '@metaplex-foundation/js/Metaplex' {
  interface Metaplex {
    derivedIdentity(): DerivedIdentityClient;
  }
}
