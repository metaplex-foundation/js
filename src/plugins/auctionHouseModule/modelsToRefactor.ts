import { PublicKey } from '@solana/web3.js';
import {
  Collection,
  Creator,
  TokenStandard,
  Uses,
} from '@metaplex-foundation/mpl-token-metadata';
import BN from 'bn.js';
import { Pda } from '@/types';
import { JsonMetadata } from '../nftModule';
import { assert, Option } from '@/utils';

export type Token = {
  model: 'token';
  address: PublicKey | Pda;
  isAssociatedToken: boolean;
  mintAddress: PublicKey;
  ownerAddress: PublicKey;
  amount: BN;
  closeAuthorityAddress: Option<PublicKey>;
  delegate: Option<PublicKey>;
  delegateAmount: BN;
};

export const isTokenModel = (value: any): value is Token =>
  typeof value === 'object' && value.model === 'token';

export const assertTokenModel = (value: any): asserts value is Token =>
  assert(isTokenModel(value), `Expected Token model`);

export type TokenWithMint = Omit<Token, 'model' | 'mintAddress'> & {
  model: 'tokenWithMint';
  mint: Mint;
};

export const isTokenWithMintModel = (value: any): value is TokenWithMint =>
  typeof value === 'object' && value.model === 'tokenWithMint';

export const assertTokenWithMintModel = (
  value: any
): asserts value is TokenWithMint =>
  assert(isTokenWithMintModel(value), `Expected TokenWithMint model`);

export type TokenWithMetadata = Omit<TokenWithMint, 'model'> & {
  model: 'tokenWithMetadata';
  metadata: Metadata;
};

export const isTokenWithMetadataModel = (
  value: any
): value is TokenWithMetadata =>
  typeof value === 'object' && value.model === 'tokenWithMetadata';

export const assertTokenWithMetadataModel = (
  value: any
): asserts value is TokenWithMetadata =>
  assert(isTokenWithMetadataModel(value), `Expected TokenWithMetadata model`);

type Mint = {
  model: 'mint';
  address: PublicKey;
  mintAuthorityAddress: Option<PublicKey>;
  freezeAuthorityAddress: Option<PublicKey>;
  decimals: number;
  supply: BN;
};

export const isMintModel = (value: any): value is Mint =>
  typeof value === 'object' && value.model === 'mint';

export const assertMintModel = (value: any): asserts value is Mint =>
  assert(isMintModel(value), `Expected Mint model`);

export type MintWithMetadata = Omit<Mint, 'model'> & {
  model: 'mintWithMetadata';
  metadata: Metadata;
};

export const isMintWithMetadataModel = (
  value: any
): value is MintWithMetadata =>
  typeof value === 'object' && value.model === 'mintWithMetadata';

export const assertMintWithMetadataModel = (
  value: any
): asserts value is MintWithMetadata =>
  assert(isMintWithMetadataModel(value), `Expected MintWithMetadata model`);

export type Metadata = {
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
};

export const isMetadataModel = (value: any): value is Metadata =>
  typeof value === 'object' && value.model === 'metadata';

export const assertMetadataModel = (value: any): asserts value is Metadata =>
  assert(isTokenModel(value), `Expected Metadata model`);
