import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Amount, Pda } from '@/types';
import { ListingReceiptAccount } from './accounts';
import { MintWithMetadata, TokenWithMetadata } from './modelsToRefactor';
import { assert, Option } from '@/utils';

export type Listing = {
  model: 'listing';
  lazy: false;

  // Addresses.
  tradeStateAddress: Pda;
  bookkeeperAddress: PublicKey;
  auctionHouseAddress: PublicKey;
  sellerAddress: PublicKey;
  metadataAddress: PublicKey;
  token: TokenWithMetadata;
  treasuryMint: MintWithMetadata;

  // Optional receipts.
  receiptAddress: Option<Pda>;
  purchaseReceiptAddress: Option<PublicKey>;

  // Data.
  price: Amount; // TODO: Get currency + decimals from auction house > treasuryMint > data + metadata(symbol).
  tokens: Amount; // TODO: Get decimals from metadata > mint > decimals.
  createdAt: BN;
  canceledAt: Option<BN>;
};

export const isListingModel = (value: any): value is Listing =>
  typeof value === 'object' && value.model === 'listing' && !value.lazy;

export const assertListingModel = (value: any): asserts value is Listing =>
  assert(isListingModel(value), `Expected Listing type`);

export type LazyListing = Omit<
  Listing,
  'model' | 'lazy' | 'token' | 'treasuryMint' | 'price' | 'tokens'
> & {
  model: 'listing';
  lazy: true;
  metadataAddress: PublicKey;
  price: BN;
  tokens: BN;
};

export const isLazyListingModel = (value: any): value is LazyListing =>
  typeof value === 'object' && value.model === 'listing' && value.lazy;

export const assertLazyListingModel = (
  value: any
): asserts value is LazyListing =>
  assert(isLazyListingModel(value), `Expected LazyListing type`);

export const createLazyListingFromReceiptAccount = (
  account: ListingReceiptAccount
): LazyListing => {
  return {
    model: 'listing',
    lazy: true,
    tradeStateAddress: new Pda(
      account.data.tradeState,
      account.data.tradeStateBump
    ),
    bookkeeperAddress: account.data.bookkeeper,
    auctionHouseAddress: account.data.auctionHouse,
    sellerAddress: account.data.seller,
    metadataAddress: account.data.metadata,

    // Optional receipts.
    receiptAddress: new Pda(
      account.data.tradeState,
      account.data.tradeStateBump
    ),
    purchaseReceiptAddress: account.data.purchaseReceipt,

    // Data.
    price: new BN(account.data.price),
    tokens: new BN(account.data.tokenSize),
    createdAt: new BN(account.data.createdAt),
    canceledAt: account.data.canceledAt
      ? new BN(account.data.canceledAt)
      : null,
  };
};
