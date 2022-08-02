import type { PublicKey } from '@solana/web3.js';
import type { Metadata } from './Metadata';
import type { Nft, NftWithToken } from './Nft';
import type { Sft, SftWithToken } from './Sft';
import { PublicKeyValues, toPublicKey } from '@/types';

export type HasMintAddress =
  | Nft
  | Sft
  | NftWithToken
  | SftWithToken
  | Metadata
  | PublicKey;

export const toMintAddress = (
  value: PublicKeyValues | HasMintAddress
): PublicKey => {
  return typeof value === 'object' && 'mintAddress' in value
    ? value.mintAddress
    : toPublicKey(value);
};
