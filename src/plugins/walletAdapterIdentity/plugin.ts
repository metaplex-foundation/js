import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import {
  WalletAdapterIdentityDriver,
  WalletAdapter,
} from './WalletAdapterIdentityDriver';

export const walletAdapterIdentity = (
  walletAdapter: WalletAdapter
): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex
      .identity()
      .setDriver(new WalletAdapterIdentityDriver(walletAdapter));
  },
});
