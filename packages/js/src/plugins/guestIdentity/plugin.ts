import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { GuestIdentityDriver } from './GuestIdentityDriver';

/** @group Plugins */
export const guestIdentity = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.identity().setDriver(new GuestIdentityDriver());
  },
});
