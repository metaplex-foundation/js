import { PublicKey } from '@solana/web3.js';
import {
  amount,
  BigNumber,
  DateTime,
  lamports,
  Pda,
  SolAmount,
  SplTokenAmount,
  toBigNumber,
  toDateTime,
  toOptionDateTime,
} from '@/types';
import { ListingReceiptAccount } from './accounts';
import { TokenWithMetadata } from '../nftModule';
import { assert, Option } from '@/utils';
import { AuctionHouse } from './AuctionHouse';

export type Listing = Readonly<{
  model: 'listing';
  lazy: false;

  // Models.
  auctionHouse: AuctionHouse;
  token: TokenWithMetadata;

  // Addresses.
  tradeStateAddress: Pda;
  sellerAddress: PublicKey;
  bookkeeperAddress: Option<PublicKey>;
  receiptAddress: Option<Pda>;
  purchaseReceiptAddress: Option<PublicKey>;

  // Data.
  price: SolAmount | SplTokenAmount;
  tokens: SplTokenAmount;
  createdAt: DateTime;
  canceledAt: Option<DateTime>;
}>;

export const isListing = (value: any): value is Listing =>
  typeof value === 'object' && value.model === 'listing' && !value.lazy;

export function assertListing(value: any): asserts value is Listing {
  assert(isListing(value), `Expected Listing type`);
}
export const toListing = (
  account: ListingReceiptAccount,
  auctionHouseModel: AuctionHouse,
  tokenModel: TokenWithMetadata
): Listing => {
  const lazyListing = toLazyListing(account, auctionHouseModel);
  return {
    ...lazyListing,
    model: 'listing',
    lazy: false,
    token: tokenModel,
    tokens: amount(lazyListing.tokens, tokenModel.mint.currency),
  };
};

export type LazyListing = Omit<Listing, 'lazy' | 'token' | 'tokens'> &
  Readonly<{
    lazy: true;
    metadataAddress: PublicKey;
    tokens: BigNumber;
  }>;

export const isLazyListing = (value: any): value is LazyListing =>
  typeof value === 'object' && value.model === 'listing' && value.lazy;

export function assertLazyListing(value: any): asserts value is LazyListing {
  assert(isLazyListing(value), `Expected LazyListing type`);
}
export const toLazyListing = (
  account: ListingReceiptAccount,
  auctionHouseModel: AuctionHouse
): LazyListing => {
  return {
    model: 'listing',
    lazy: true,
    auctionHouse: auctionHouseModel,
    tradeStateAddress: new Pda(
      account.data.tradeState,
      account.data.tradeStateBump
    ),
    bookkeeperAddress: account.data.bookkeeper,
    sellerAddress: account.data.seller,
    metadataAddress: account.data.metadata,
    receiptAddress: new Pda(
      account.data.tradeState,
      account.data.tradeStateBump
    ),
    purchaseReceiptAddress: account.data.purchaseReceipt,

    // Data.
    price: auctionHouseModel.isNative
      ? lamports(account.data.price)
      : amount(account.data.price, auctionHouseModel.treasuryMint.currency),
    tokens: toBigNumber(account.data.tokenSize),
    createdAt: toDateTime(account.data.createdAt),
    canceledAt: toOptionDateTime(account.data.canceledAt),
  };
};
