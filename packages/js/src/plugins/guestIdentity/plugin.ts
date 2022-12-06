import { PublicKey } from '@solana/web3.js';
import type { Metaplex, MetaplexPlugin } from '@metaplex-foundation/js-core';
import { GuestIdentityDriver } from './GuestIdentityDriver';

/** @group Plugins */
export const guestIdentity = (publicKey?: PublicKey): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.identity().setDriver(new GuestIdentityDriver(publicKey));
  },
});
