import { Keypair } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { KeypairIdentityDriver } from './KeypairIdentityDriver';

export const keypairIdentity = (keypair: Keypair): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.identity().setDriver(new KeypairIdentityDriver(keypair));
  },
});
