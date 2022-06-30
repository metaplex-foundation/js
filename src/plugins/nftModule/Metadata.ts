import { PublicKey } from '@solana/web3.js';
import {
  Collection,
  Creator,
  TokenStandard,
  Uses,
} from '@metaplex-foundation/mpl-token-metadata';
import { amount, Pda } from '@/types';
import { JsonMetadata } from '../nftModule';
import { assert, Option, removeEmptyChars } from '@/utils';
import { findMetadataPda, MetadataAccount } from '@/programs';
import {
  makeMintModel,
  makeTokenWithMintModel,
  Mint,
  MintAccount,
  TokenAccount,
  TokenWithMint,
} from '../tokenModule';

export type Metadata = Readonly<{
  model: 'metadata';
  address: Pda;
  mintAddress: PublicKey;
  updateAuthorityAddress: PublicKey;
  json: Option<JsonMetadata>;
  jsonLoaded: boolean;
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

export const isMetadataModel = (value: any): value is Metadata =>
  typeof value === 'object' && value.model === 'metadata';

export const assertMetadataModel = (value: any): asserts value is Metadata =>
  assert(isMetadataModel(value), `Expected Metadata model`);

export const makeMetadataModel = (
  account: MetadataAccount,
  json?: Option<JsonMetadata>
): Metadata => ({
  model: 'metadata',
  address: findMetadataPda(account.data.mint),
  mintAddress: account.data.mint,
  updateAuthorityAddress: account.data.updateAuthority,
  json: json ?? null,
  jsonLoaded: json !== undefined,
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
  uses: account.data.uses,
});

export type MintWithMetadata = Omit<Mint, 'model'> &
  Readonly<{
    model: 'mintWithMetadata';
    metadata: Metadata;
  }>;

export const isMintWithMetadataModel = (
  value: any
): value is MintWithMetadata =>
  typeof value === 'object' && value.model === 'mintWithMetadata';

export const assertMintWithMetadataModel = (
  value: any
): asserts value is MintWithMetadata =>
  assert(isMintWithMetadataModel(value), `Expected MintWithMetadata model`);

export const makeMintWithMetadataModel = (
  mintAccount: MintAccount,
  metadataModel: Metadata
): MintWithMetadata => {
  const mint = makeMintModel(mintAccount);
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
    metadata: Metadata;
  }>;

export const isTokenWithMetadataModel = (
  value: any
): value is TokenWithMetadata =>
  typeof value === 'object' && value.model === 'tokenWithMetadata';

export const assertTokenWithMetadataModel = (
  value: any
): asserts value is TokenWithMetadata =>
  assert(isTokenWithMetadataModel(value), `Expected TokenWithMetadata model`);

export const makeTokenWithMetadataModel = (
  tokenAccount: TokenAccount,
  mintModel: Mint,
  metadataModel: Metadata
): TokenWithMetadata => {
  const token = makeTokenWithMintModel(tokenAccount, mintModel);
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
