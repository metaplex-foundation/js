import { PublicKey, PublicKeyInitData } from '@solana/web3.js';

export type PublicKeyString = string;
export type PublicKeyValues = PublicKeyInitData | { publicKey: PublicKey };

export const toPublicKey = (value: PublicKeyValues): PublicKey => {
  return typeof value === 'object' && 'publicKey' in value
    ? value.publicKey
    : new PublicKey(value);
};
