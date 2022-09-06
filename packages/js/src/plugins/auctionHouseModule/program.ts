import { PROGRAM_ID } from '@metaplex-foundation/mpl-auction-house';
import { Metaplex } from '@/Metaplex';
import {
  BidReceiptGpaBuilder,
  ListingReceiptGpaBuilder,
  PurchaseReceiptGpaBuilder,
} from './gpaBuilders';

/** @group Programs */
export const AuctionHouseProgram = {
  publicKey: PROGRAM_ID,

  bidAccounts(metaplex: Metaplex) {
    return new BidReceiptGpaBuilder(metaplex, this.publicKey);
  },

  listingAccounts(metaplex: Metaplex) {
    return new ListingReceiptGpaBuilder(metaplex, this.publicKey);
  },

  purchaseAccounts(metaplex: Metaplex) {
    return new PurchaseReceiptGpaBuilder(metaplex, this.publicKey);
  },
};
