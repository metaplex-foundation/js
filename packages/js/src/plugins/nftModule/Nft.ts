import type { PublicKey } from '@solana/web3.js';
import { Pda } from '@/types';
import { assert } from '@/utils';
import { Metadata } from './Metadata';
import { Mint, Token } from '../tokenModule';
import { NftEdition } from './NftEdition';

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
): Nft => ({
  ...toSftWithToken(metadata, mint, token),
  model: 'nft',
  edition,
});

export type Sft = Omit<Metadata, 'model' | 'address' | 'mintAddress'> &
  Readonly<{
    model: 'sft';
    address: PublicKey;
    metadataAddress: Pda;
    mint: Mint;
  }>;

export const isSft = (value: any): value is Sft =>
  typeof value === 'object' && value.model === 'sft';

export function assertSft(value: any): asserts value is Sft {
  assert(isSft(value), `Expected Sft model`);
}

export const toSft = (metadata: Metadata, mint: Mint): Sft => {
  const { address, mintAddress, ...shared } = metadata;
  assert(
    mintAddress.equals(mint.address),
    'The provided mint does not match the mint address in the metadata'
  );

  return {
    ...shared,
    model: 'sft',
    address: mintAddress,
    metadataAddress: address,
    mint,
  };
};

export type SftWithToken = Sft & { token: Token };

export const isSftWithToken = (value: any): value is SftWithToken =>
  isSft(value) && 'token' in value;

export function assertSftWithToken(value: any): asserts value is SftWithToken {
  assert(isSftWithToken(value), `Expected Sft model with token`);
}

export const toSftWithToken = (
  metadata: Metadata,
  mint: Mint,
  token: Token
): SftWithToken => ({
  ...toSft(metadata, mint),
  token,
});
