import { PublicKey } from '@solana/web3.js';
import { GuestIdentityDriver } from './GuestIdentityDriver';
import { MetaplexPlugin } from '@metaplex-foundation/js';
import { Metaplex } from '@metaplex-foundation/js/Metaplex';
/** @group Plugins */
export const guestIdentity = (publicKey?: PublicKey): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.identity().setDriver(new GuestIdentityDriver(publicKey));
  },
});
