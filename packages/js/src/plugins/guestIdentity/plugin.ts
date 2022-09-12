import { PublicKey } from '@solana/web3.js';
import { GuestIdentityDriver } from './GuestIdentityDriver';
import { MetaplexPlugin } from '@/types';
import { Metaplex as MetaplexType } from '@/Metaplex';
/** @group Plugins */
export const guestIdentity = (publicKey?: PublicKey): MetaplexPlugin => ({
  install(metaplex: MetaplexType) {
    metaplex.identity().setDriver(new GuestIdentityDriver(publicKey));
  },
});
