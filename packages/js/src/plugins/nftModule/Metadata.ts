import { PublicKey } from '@solana/web3.js';
import {
  Collection,
  TokenStandard,
  UseMethod,
} from '@metaplex-foundation/mpl-token-metadata';
import { amount, BigNumber, Creator, Pda, toBigNumber } from '@/types';
import { JsonMetadata } from '../nftModule';
import { assert, Option, removeEmptyChars } from '@/utils';
import { findMetadataPda } from './pdas';
import { MetadataAccount } from './accounts';
import {
  toMint,
  toTokenWithMint,
  Mint,
  MintAccount,
  TokenAccount,
  TokenWithMint,
} from '../tokenModule';

export type Metadata = Readonly<{
  model: 'metadata';
  lazy: false;
  address: Pda;
  mintAddress: PublicKey;
  updateAuthorityAddress: PublicKey;
  json: Option<JsonMetadata>;
  name: string;
  symbol: string;
  uri: string;
  isMutable: boolean;
  primarySaleHappened: boolean;
  sellerFeeBasisPoints: number;
  editionNonce: Option<number>;
  creators: Creator[];
  tokenStandard: Option<TokenStandard>;
  collection: Option<Collection>;
  uses: Option<Uses>;
}>;

type Uses = {
  useMethod: UseMethod;
  remaining: BigNumber;
  total: BigNumber;
};

export const isMetadata = (value: any): value is Metadata =>
  typeof value === 'object' && value.model === 'metadata';

export function assertMetadata(value: any): asserts value is Metadata {
  assert(isMetadata(value), `Expected Metadata model`);
}
export const toMetadata = (
  account: MetadataAccount,
  json: Option<JsonMetadata>
): Metadata => ({
  ...toLazyMetadata(account),
  lazy: false,
  json,
});

export type LazyMetadata = Omit<
  Metadata,
  'lazy' | 'mint' | 'edition' | 'json'
> &
  Readonly<{
    lazy: true;
  }>;

export const isLazyMetadata = (value: any): value is LazyMetadata =>
  typeof value === 'object' && value.model === 'metadata' && value.lazy;

export function assertLazyMetadata(value: any): asserts value is LazyMetadata {
  assert(isLazyMetadata(value), `Expected LazyMetadata model`);
}
export const toLazyMetadata = (account: MetadataAccount): LazyMetadata => ({
  model: 'metadata',
  lazy: true,
  address: findMetadataPda(account.data.mint),
  mintAddress: account.data.mint,
  updateAuthorityAddress: account.data.updateAuthority,
  name: removeEmptyChars(account.data.data.name),
  symbol: removeEmptyChars(account.data.data.symbol),
  uri: removeEmptyChars(account.data.data.uri),
  isMutable: account.data.isMutable,
  primarySaleHappened: account.data.primarySaleHappened,
  sellerFeeBasisPoints: account.data.data.sellerFeeBasisPoints,
  editionNonce: account.data.editionNonce,
  creators: account.data.data.creators ?? [],
  tokenStandard: account.data.tokenStandard,
  collection: account.data.collection,
  uses: account.data.uses
    ? {
        ...account.data.uses,
        remaining: toBigNumber(account.data.uses.remaining),
        total: toBigNumber(account.data.uses.total),
      }
    : null,
});

export type MintWithMetadata = Omit<Mint, 'model'> &
  Readonly<{
    model: 'mintWithMetadata';
    metadata: Metadata | LazyMetadata;
  }>;

export const isMintWithMetadata = (value: any): value is MintWithMetadata =>
  typeof value === 'object' && value.model === 'mintWithMetadata';

export function assertMintWithMetadata(
  value: any
): asserts value is MintWithMetadata {
  assert(isMintWithMetadata(value), `Expected MintWithMetadata model`);
}

export const toMintWithMetadata = (
  mintAccount: MintAccount,
  metadataModel: Metadata | LazyMetadata
): MintWithMetadata => {
  const mint = toMint(mintAccount);
  const currency = {
    ...mint.currency,
    symbol: metadataModel.symbol || 'Token',
  };

  return {
    ...mint,
    model: 'mintWithMetadata',
    metadata: metadataModel,
    currency,
    supply: amount(mint.supply.basisPoints, currency),
  };
};

export type TokenWithMetadata = Omit<TokenWithMint, 'model'> &
  Readonly<{
    model: 'tokenWithMetadata';
    metadata: Metadata | LazyMetadata;
  }>;

export const isTokenWithMetadata = (value: any): value is TokenWithMetadata =>
  typeof value === 'object' && value.model === 'tokenWithMetadata';

export function assertTokenWithMetadata(
  value: any
): asserts value is TokenWithMetadata {
  assert(isTokenWithMetadata(value), `Expected TokenWithMetadata model`);
}

export const toTokenWithMetadata = (
  tokenAccount: TokenAccount,
  mintModel: Mint,
  metadataModel: Metadata | LazyMetadata
): TokenWithMetadata => {
  const token = toTokenWithMint(tokenAccount, mintModel);
  const currency = {
    ...token.mint.currency,
    symbol: metadataModel.symbol || 'Token',
  };

  return {
    ...token,
    model: 'tokenWithMetadata',
    mint: {
      ...token.mint,
      currency,
      supply: amount(token.mint.supply.basisPoints, currency),
    },
    metadata: metadataModel,
    amount: amount(token.amount.basisPoints, currency),
    delegateAmount: amount(token.delegateAmount.basisPoints, currency),
  };
};
