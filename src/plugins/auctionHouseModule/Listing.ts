import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { amount, Amount, Pda } from '@/types';
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
  price: Amount;
  tokens: Amount;
  createdAt: BN;
  canceledAt: Option<BN>;
}>;

export const isListingModel = (value: any): value is Listing =>
  typeof value === 'object' && value.model === 'listing' && !value.lazy;

export const assertListingModel = (value: any): asserts value is Listing =>
  assert(isListingModel(value), `Expected Listing type`);

export const makeListingModel = (
  account: ListingReceiptAccount,
  auctionHouseModel: AuctionHouse,
  tokenModel: TokenWithMetadata
): Listing => {
  const lazyListing = makeLazyListingModel(account, auctionHouseModel);
  return {
    ...lazyListing,
    model: 'listing',
    lazy: false,
    token: tokenModel,
    tokens: amount(lazyListing.tokens, tokenModel.mint.currency),
  };
};

export type LazyListing = Omit<Listing, 'model' | 'lazy' | 'token' | 'tokens'> &
  Readonly<{
    model: 'listing';
    lazy: true;
    metadataAddress: PublicKey;
    tokens: BN;
  }>;

export const isLazyListingModel = (value: any): value is LazyListing =>
  typeof value === 'object' && value.model === 'listing' && value.lazy;

export const assertLazyListingModel = (
  value: any
): asserts value is LazyListing =>
  assert(isLazyListingModel(value), `Expected LazyListing type`);

export const makeLazyListingModel = (
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
    price: amount(account.data.price, auctionHouseModel.treasuryMint.currency),
    tokens: new BN(account.data.tokenSize),
    createdAt: new BN(account.data.createdAt),
    canceledAt: account.data.canceledAt
      ? new BN(account.data.canceledAt)
      : null,
  };
};
