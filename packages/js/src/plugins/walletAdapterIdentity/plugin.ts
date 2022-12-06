import type { Metaplex, MetaplexPlugin } from '@metaplex-foundation/js-core';
import { WalletAdapter, WalletAdapterIdentity } from './WalletAdapterIdentity';

export const walletAdapterIdentity = (
  walletAdapter: WalletAdapter
): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.identity = new WalletAdapterIdentity(walletAdapter);
  },
});
