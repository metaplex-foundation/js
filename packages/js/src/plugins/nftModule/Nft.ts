import type { PublicKey } from '@solana/web3.js';
import type { Pda } from '@/types';
import type { Metadata } from './Metadata';
import type { Mint, Token } from '../tokenModule';
import type { NftEdition } from './NftEdition';
import { assert } from '@/utils';
import { toSft, toSftWithToken } from './Sft';

export type Nft = Omit<Metadata, 'model' | 'address' | 'mintAddress'> &
  Readonly<{
    model: 'nft';
    address: PublicKey;
    metadataAddress: Pda;
    mint: Mint;
    edition: NftEdition;
  }>;

export const isNft = (value: any): value is Nft =>
  typeof value === 'object' && value.model === 'nft';

export function assertNft(value: any): asserts value is Nft {
  assert(isNft(value), `Expected Nft model`);
}

export const toNft = (
  metadata: Metadata,
  mint: Mint,
  edition: NftEdition
): Nft => ({
  ...toSft(metadata, mint),
  model: 'nft',
  edition,
});

export type NftWithToken = Nft & { token: Token };

export const isNftWithToken = (value: any): value is NftWithToken =>
  isNft(value) && 'token' in value;

export function assertNftWithToken(value: any): asserts value is NftWithToken {
  assert(isNftWithToken(value), `Expected Nft model with token`);
}

export const toNftWithToken = (
  metadata: Metadata,
  mint: Mint,
  edition: NftEdition,
  token: Token
): NftWithToken => ({
  ...toSftWithToken(metadata, mint, token),
  model: 'nft',
  edition,
});
