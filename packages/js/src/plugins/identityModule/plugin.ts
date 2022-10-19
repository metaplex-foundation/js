import { IdentityClient } from './IdentityClient';
import type { Metaplex } from '@metaplex-foundation/js-core/Metaplex';
import { MetaplexPlugin } from '@metaplex-foundation/js-core';

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
