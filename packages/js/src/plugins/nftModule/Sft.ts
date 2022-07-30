import type { PublicKey } from '@solana/web3.js';
import { amount, Pda } from '@/types';
import type { Metadata } from './Metadata';
import type { Mint, Token } from '../tokenModule';
import { assert } from '@/utils';

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

  const currency = {
    ...mint.currency,
    symbol: metadata.symbol || 'Token',
  };

  return {
    ...shared,
    model: 'sft',
    address: mintAddress,
    metadataAddress: address,
    mint: {
      ...mint,
      currency,
      supply: amount(mint.supply.basisPoints, currency),
    },
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
): SftWithToken => {
  const sft = toSft(metadata, mint);
  const currency = sft.mint.currency;
  return {
    ...sft,
    token: {
      ...token,
      amount: amount(token.amount.basisPoints, currency),
      delegateAmount: amount(token.delegateAmount.basisPoints, currency),
    },
  };
};
