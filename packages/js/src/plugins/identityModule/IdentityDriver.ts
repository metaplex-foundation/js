import { IdentitySigner } from '@metaplex-foundation/js';

export type IdentityDriver = IdentitySigner & {
  secretKey?: Uint8Array;
};
