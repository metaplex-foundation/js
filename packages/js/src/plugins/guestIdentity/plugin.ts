import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { PublicKey } from '@solana/web3.js';
import { GuestIdentityDriver } from './GuestIdentityDriver';

/** @group Plugins */
export const guestIdentity = (publicKey?: PublicKey): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.identity().setDriver(new GuestIdentityDriver(publicKey));
  },
});
