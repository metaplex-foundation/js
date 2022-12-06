import type { Metaplex, MetaplexPlugin } from '@metaplex-foundation/js-core';
import { IdentityClient } from './IdentityClient';

/** @group Plugins */
export const identityModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const identityClient = new IdentityClient();
    metaplex.identity = () => identityClient;
  },
});

declare module '@metaplex-foundation/js-core' {
  interface Metaplex {
    identity(): IdentityClient;
  }
}
