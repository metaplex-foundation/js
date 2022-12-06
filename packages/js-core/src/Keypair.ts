import type { PublicKey } from './PublicKey';

export type Keypair = {
  publicKey: PublicKey;
  secretKey: Uint8Array;
};
