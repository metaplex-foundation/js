import { Keypair } from '@solana/web3.js';
import type { Metaplex, MetaplexPlugin } from '@metaplex-foundation/js-core';
import { KeypairIdentityDriver } from './KeypairIdentityDriver';

export const keypairIdentity = (keypair: Keypair): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.identity().setDriver(new KeypairIdentityDriver(keypair));
  },
});
