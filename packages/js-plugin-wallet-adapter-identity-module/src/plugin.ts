import {
  WalletAdapterIdentityDriver,
  WalletAdapter,
} from './WalletAdapterIdentityDriver';
import { Metaplex } from '@metaplex-foundation/js-core/Metaplex';
import { MetaplexPlugin } from '@metaplex-foundation/js-core';

export const walletAdapterIdentity = (
  walletAdapter: WalletAdapter
): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex
      .identity()
      .setDriver(new WalletAdapterIdentityDriver(walletAdapter));
  },
});
