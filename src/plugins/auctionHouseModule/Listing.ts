import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Amount, Pda } from '@/types';
import { ListingReceiptAccount } from './accounts';
import { MetadataAccount } from '@/programs';

export type IdealListing = {
  // Addresses.
  tradeStateAddress: Pda;
  bookkeeperAddress: PublicKey;
  auctionHouseAddress: PublicKey;
  sellerAddress: PublicKey;
  metadataAddress: PublicKey;

  // Optional receipts.
  receiptAddress: Pda | null;
  purchaseReceiptAddress: PublicKey | null;

  // Stuff.
  mint: {
    address: PublicKey;
    mintAuthorityAddress: PublicKey | null;
    freezeAuthorityAddress: PublicKey | null;
    decimals: number;
    // ...
  };

  token: {
    address: PublicKey;
    amount: BN;
    // ...
  };

  metadata: {
    address: PublicKey;
    json: any;
    name: string;
    uri: string;
    // ...
  };

  treasuryMint: {
    address: PublicKey;
    // ...
  };

  treasuryMetadata: null | {
    address: PublicKey;
    // ...
  };

  // Data.
  price: Amount;
  tokens: Amount;
  createdAt: BN;
  canceledAt: BN | null;
};

export type LazyListing = {
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

export type Listing = Omit<LazyListing, 'price' | 'token'> & {
  mintAccount: any; // MintAccount.
  metadataAccount: MetadataAccount;
  tokenAccount: any; // TokenAccount.
  treasuryMintAccount: any | null; // MintAccount.
  treasuryMetadataAccount: MetadataAccount | null;
  price: Amount; // TODO: Get currency + decimals from auction house > treasuryMint > data + metadata(symbol).
  tokens: Amount; // TODO: Get decimals from metadata > mint > decimals.
};

export const createLazyListingFromReceiptAccount = (
  account: ListingReceiptAccount
): LazyListing => {
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
