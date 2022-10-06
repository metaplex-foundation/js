import { IdentityClient } from './IdentityClient';
import type { Metaplex } from '@/Metaplex';

import { MetaplexPlugin } from '@/types';

/** @group Plugins */
export const identityModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const identityClient = new IdentityClient();
    metaplex.identity = () => identityClient;
  },
});

declare module '@metaplex-foundation/js-core/Metaplex' {
  interface Metaplex {
    identity(): IdentityClient;
  }
}
