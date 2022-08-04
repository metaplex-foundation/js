import {
  Auctioneer,
  AuctionHouse,
  ListingReceipt,
  BidReceipt,
  PurchaseReceipt,
} from '@metaplex-foundation/mpl-auction-house';
import {
  Account,
  getAccountParsingAndAssertingFunction,
  getAccountParsingFunction,
} from '@/types';

export type AuctioneerAccount = Account<Auctioneer>;
export const parseAuctioneerAccount = getAccountParsingFunction(Auctioneer);
export const toAuctioneerAccount =
  getAccountParsingAndAssertingFunction(Auctioneer);

export type AuctionHouseAccount = Account<AuctionHouse>;
export const parseAuctionHouseAccount = getAccountParsingFunction(AuctionHouse);
export const toAuctionHouseAccount =
  getAccountParsingAndAssertingFunction(AuctionHouse);

export type ListingReceiptAccount = Account<ListingReceipt>;
export const parseListingReceiptAccount =
  getAccountParsingFunction(ListingReceipt);
export const toListingReceiptAccount =
  getAccountParsingAndAssertingFunction(ListingReceipt);

export type BidReceiptAccount = Account<BidReceipt>;
export const parseBidReceiptAccount = getAccountParsingFunction(BidReceipt);
export const toBidReceiptAccount =
  getAccountParsingAndAssertingFunction(BidReceipt);

export type PurchaseReceiptAccount = Account<PurchaseReceipt>;
export const parsePurchaseReceiptAccount =
  getAccountParsingFunction(PurchaseReceipt);
export const toPurchaseReceiptAccount =
  getAccountParsingAndAssertingFunction(PurchaseReceipt);
