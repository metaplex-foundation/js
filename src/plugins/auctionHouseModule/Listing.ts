import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Amount, Pda } from '@/types';
import { ListingReceiptAccount } from './accounts';
import { MetadataAccount } from '@/programs';

export type Listing = {
  // Addresses.
  tradeStateAddress: Pda;
  bookkeeperAddress: PublicKey;
  auctionHouseAddress: PublicKey;
  sellerAddress: PublicKey;
  metadataAddress: PublicKey;

  // Optional receipts.
  receiptAddress: Pda | null;
  purchaseReceiptAddress: PublicKey | null;

  // Data.
  price: BN;
  tokens: BN;
  createdAt: BN;
  canceledAt: BN | null;
};

export type LoadedListing = Omit<Listing, 'price' | 'token'> & {
  metadataAccount: MetadataAccount;
  treasuryMintAccount: any; // MintAccount.
  price: Amount; // TODO: Get currency + decimals from auction house > treasuryMint > data + metadata(symbol).
  tokens: Amount; // TODO: Get decimals from metadata > mint > decimals.
};

export const createListingFromReceiptAccount = (
  account: ListingReceiptAccount
): Listing => {
  return {
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
