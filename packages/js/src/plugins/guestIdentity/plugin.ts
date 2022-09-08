import { GuestIdentityDriver } from './GuestIdentityDriver';
import { Metaplex as MetaplexType } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';

/** @group Plugins */
export const guestIdentity = (): MetaplexPlugin => ({
  install(metaplex: MetaplexType) {
    metaplex.identity().setDriver(new GuestIdentityDriver());
  },
});
