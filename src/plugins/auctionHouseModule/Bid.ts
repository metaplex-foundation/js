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
import { BidReceiptAccount } from './accounts';
import { TokenWithMetadata } from '../nftModule';
import { assert, Option } from '@/utils';
import { AuctionHouse } from './AuctionHouse';

export type Bid = Readonly<{
  model: 'bid';
  lazy: false;

  // Models.
  auctionHouse: AuctionHouse;
  token: TokenWithMetadata;

  // Addresses.
  tradeStateAddress: Pda;
  buyerAddress: PublicKey;
  bookkeeperAddress: Option<PublicKey>;
  receiptAddress: Option<Pda>;
  purchaseReceiptAddress: Option<PublicKey>;

  // Data.
  price: SolAmount | SplTokenAmount;
  tokens: SplTokenAmount;
  createdAt: DateTime;
  canceledAt: Option<DateTime>;
}>;

export const isBid = (value: any): value is Bid =>
  typeof value === 'object' && value.model === 'bid' && !value.lazy;

export function assertBid(value: any): asserts value is Bid {
  assert(isBid(value), `Expected Bid type`);
}
export const toBid = (
  account: BidReceiptAccount,
  auctionHouseModel: AuctionHouse,
  tokenModel: TokenWithMetadata
): Bid => {
  const lazyBid = toLazyBid(account, auctionHouseModel);
  return {
    ...lazyBid,
    model: 'bid',
    lazy: false,
    token: tokenModel,
    tokens: amount(lazyBid.tokens, tokenModel.mint.currency),
  };
};

export type LazyBid = Omit<Bid, 'lazy' | 'token' | 'tokens'> &
  Readonly<{
    lazy: true;
    metadataAddress: PublicKey;
    tokens: BigNumber;
  }>;

export const isLazyBid = (value: any): value is LazyBid =>
  typeof value === 'object' && value.model === 'bid' && value.lazy;

export function assertLazyBid(value: any): asserts value is LazyBid {
  assert(isLazyBid(value), `Expected LazyBid type`);
}
export const toLazyBid = (
  account: BidReceiptAccount,
  auctionHouseModel: AuctionHouse
): LazyBid => {
  return {
    model: 'bid',
    lazy: true,
    auctionHouse: auctionHouseModel,
    tradeStateAddress: new Pda(
      account.data.tradeState,
      account.data.tradeStateBump
    ),
    bookkeeperAddress: account.data.bookkeeper,
    buyerAddress: account.data.buyer,
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
