import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { GuestIdentityDriver } from '../guestIdentity';
import { WalletAdapterIdentityDriver, WalletAdapter } from './WalletAdapterIdentityDriver';

export const walletAdapterIdentity = (walletAdapter: WalletAdapter): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.setIdentityDriver(new WalletAdapterIdentityDriver(metaplex, walletAdapter));
  },
});

export const walletOrGuestIdentity = (walletAdapter?: WalletAdapter | null): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const identity = walletAdapter
      ? new WalletAdapterIdentityDriver(metaplex, walletAdapter)
      : new GuestIdentityDriver(metaplex);

    metaplex.setIdentityDriver(identity);
  },
});
