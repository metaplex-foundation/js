import type {
  Metaplex,
  MetaplexPlugin,
  PublicKey,
} from '@metaplex-foundation/js-core';
import { GuestIdentity } from './GuestIdentity';

/** @group Plugins */
export const guestIdentity = (publicKey?: PublicKey): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.identity = new GuestIdentity(metaplex, publicKey);
  },
});
