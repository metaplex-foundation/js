import {
  AuctionHouse,
  ListingReceipt,
} from '@metaplex-foundation/mpl-auction-house';
import { Account, getAccountParsingFunction } from '@/types';

export type AuctionHouseAccount = Account<AuctionHouse>;
export const parseAuctionHouseAccount = getAccountParsingFunction(AuctionHouse);

export type ListingReceiptAccount = Account<ListingReceipt>;
export const parseListingReceiptAccount =
  getAccountParsingFunction(ListingReceipt);
