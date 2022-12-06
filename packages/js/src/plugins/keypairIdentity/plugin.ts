import { Keypair } from '@solana/web3.js';
import type { Metaplex, MetaplexPlugin } from '@metaplex-foundation/js-core';
import { KeypairIdentity } from './KeypairIdentity';

export const keypairIdentity = (keypair: Keypair): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.identity = new KeypairIdentity(metaplex, keypair);
  },
});
