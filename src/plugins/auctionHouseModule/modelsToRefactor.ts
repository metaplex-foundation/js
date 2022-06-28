import { PublicKey } from '@solana/web3.js';
import {
  Collection,
  Creator,
  TokenStandard,
  Uses,
} from '@metaplex-foundation/mpl-token-metadata';
import BN from 'bn.js';
import {
  Account,
  Currency,
  getAccountParsingFunction,
  Pda,
  SOL,
} from '@/types';
import { JsonMetadata } from '../nftModule';
import { assert, Option, removeEmptyChars } from '@/utils';
import {
  RawAccount as SplTokenAccount,
  AccountLayout as SplTokenAccountLayout,
  RawMint as SplMintAccount,
  MintLayout as SplMintAccountLayout,
} from '@solana/spl-token';
import { findMetadataPda, MetadataAccount } from '@/programs';

export const WRAPPED_SOL_MINT = new PublicKey(
  'So11111111111111111111111111111111111111112'
);

// -----------------
// Accounts
// -----------------

export type TokenAccount = Account<SplTokenAccount>;
export const parseTokenAccount = getAccountParsingFunction({
  name: 'TokenAccount',
  deserialize: (data: Buffer, offset?: number) => {
    const span = SplTokenAccountLayout.getSpan(data, offset);
    const decoded = SplTokenAccountLayout.decode(data, offset);
    return [decoded, span];
  },
});

export type MintAccount = Account<SplMintAccount>;
export const parseMintAccount = getAccountParsingFunction({
  name: 'MintAccount',
  deserialize: (data: Buffer, offset?: number) => {
    const span = SplMintAccountLayout.getSpan(data, offset);
    const decoded = SplMintAccountLayout.decode(data, offset);
    return [decoded, span];
  },
});

// -----------------
// Models
// -----------------

export type Token = Readonly<{
  model: 'token';
  address: PublicKey | Pda;
  isAssociatedToken: boolean;
  mintAddress: PublicKey;
  ownerAddress: PublicKey;
  amount: BN; // TODO(loris): Replace with Amount on TokenWithX?
  closeAuthorityAddress: Option<PublicKey>;
  delegateAddress: Option<PublicKey>;
  delegateAmount: BN; // TODO(loris): Replace with Amount on TokenWithX?
}>;

export const isTokenModel = (value: any): value is Token =>
  typeof value === 'object' && value.model === 'token';

export const assertTokenModel = (value: any): asserts value is Token =>
  assert(isTokenModel(value), `Expected Token model`);

export const makeTokenModel = (
  account: TokenAccount,
  associatedAddress?: Pda
): Token => ({
  model: 'token',
  address: associatedAddress ?? account.publicKey,
  isAssociatedToken: !!associatedAddress,
  mintAddress: account.data.mint,
  ownerAddress: account.data.owner,
  amount: new BN(account.data.amount.toString()),
  closeAuthorityAddress: account.data.closeAuthorityOption
    ? account.data.closeAuthority
    : null,
  delegateAddress: account.data.delegateOption ? account.data.delegate : null,
  delegateAmount: new BN(account.data.delegatedAmount.toString()),
});

export type TokenWithMint = Readonly<
  Omit<Token, 'model' | 'mintAddress'> & {
    model: 'tokenWithMint';
    mint: Mint;
  }
>;

export const isTokenWithMintModel = (value: any): value is TokenWithMint =>
  typeof value === 'object' && value.model === 'tokenWithMint';

export const assertTokenWithMintModel = (
  value: any
): asserts value is TokenWithMint =>
  assert(isTokenWithMintModel(value), `Expected TokenWithMint model`);

export const makeTokenWithMintModel = (
  tokenAccount: TokenAccount,
  mintModel: Mint,
  associatedAddress?: Pda
): TokenWithMint => {
  const token = makeTokenModel(tokenAccount, associatedAddress);
  return {
    ...token,
    model: 'tokenWithMint',
    mint: mintModel,
  };
};

export type TokenWithMetadata = Readonly<
  Omit<TokenWithMint, 'model'> & {
    model: 'tokenWithMetadata';
    metadata: Metadata;
  }
>;

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
  metadataModel: Metadata,
  associatedAddress?: Pda
): TokenWithMetadata => {
  const token = makeTokenModel(tokenAccount, associatedAddress);
  return {
    ...token,
    model: 'tokenWithMetadata',
    mint: mintModel,
    metadata: metadataModel,
  };
};

export type Mint = Readonly<{
  model: 'mint';
  address: PublicKey;
  mintAuthorityAddress: Option<PublicKey>;
  freezeAuthorityAddress: Option<PublicKey>;
  decimals: number;
  supply: BN; // TODO(loris): Replace with Amount?
  isWrappedSol: boolean;
  currency: Currency;
}>;

export const isMintModel = (value: any): value is Mint =>
  typeof value === 'object' && value.model === 'mint';

export const assertMintModel = (value: any): asserts value is Mint =>
  assert(isMintModel(value), `Expected Mint model`);

export const makeMintModel = (account: MintAccount): Mint => {
  const isWrappedSol = account.publicKey.equals(WRAPPED_SOL_MINT);

  return {
    model: 'mint',
    address: account.publicKey,
    mintAuthorityAddress: account.data.mintAuthorityOption
      ? account.data.mintAuthority
      : null,
    freezeAuthorityAddress: account.data.freezeAuthorityOption
      ? account.data.freezeAuthority
      : null,
    decimals: account.data.decimals,
    supply: new BN(account.data.supply.toString()),
    isWrappedSol,
    currency: isWrappedSol
      ? SOL
      : {
          symbol: 'Token',
          decimals: account.data.decimals,
          namespace: 'spl-token',
        },
  };
};

export type MintWithMetadata = Readonly<
  Omit<Mint, 'model'> & {
    model: 'mintWithMetadata';
    metadata: Metadata;
  }
>;

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
  return {
    ...mint,
    model: 'mintWithMetadata',
    metadata: metadataModel,
    currency: {
      ...mint.currency,
      symbol: metadataModel.symbol,
    },
  };
};

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
  assert(isTokenModel(value), `Expected Metadata model`);

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
