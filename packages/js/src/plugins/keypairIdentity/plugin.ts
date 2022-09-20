import { Keypair } from '@solana/web3.js';
import { KeypairIdentityDriver } from './KeypairIdentityDriver';
import { Metaplex } from '@metaplex-foundation/js/Metaplex';
import { MetaplexPlugin } from '@metaplex-foundation/js';

export const keypairIdentity = (keypair: Keypair): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.identity().setDriver(new KeypairIdentityDriver(keypair));
  },
});
