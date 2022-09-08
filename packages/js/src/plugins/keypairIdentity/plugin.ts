import { Keypair } from '@solana/web3.js';
import { KeypairIdentityDriver } from './KeypairIdentityDriver';
import { Metaplex as MetaplexType } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';

export const keypairIdentity = (keypair: Keypair): MetaplexPlugin => ({
  install(metaplex: MetaplexType) {
    metaplex.identity().setDriver(new KeypairIdentityDriver(keypair));
  },
});
