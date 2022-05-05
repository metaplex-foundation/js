import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { GuestIdentityDriver } from './GuestIdentityDriver';

export const guestIdentity = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.setIdentityDriver(new GuestIdentityDriver(metaplex));
  },
});
