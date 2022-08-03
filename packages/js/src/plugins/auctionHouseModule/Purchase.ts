import { PublicKey } from '@solana/web3.js';
import {
  amount,
  BigNumber,
  DateTime,
  lamports,
  SolAmount,
  SplTokenAmount,
  toBigNumber,
  toDateTime,
} from '@/types';
import { PurchaseReceiptAccount } from './accounts';
import { assert, Option } from '@/utils';
import { AuctionHouse } from './AuctionHouse';
import { NftWithToken, SftWithToken } from '../nftModule';

export type Purchase = Readonly<{
  model: 'purchase';
  lazy: false;

  // Models.
  auctionHouse: AuctionHouse;
  asset: SftWithToken | NftWithToken;

  // Addresses.
  buyerAddress: PublicKey;
  sellerAddress: PublicKey;
  bookkeeperAddress: Option<PublicKey>;
  receiptAddress: Option<PublicKey>;

  // Data.
  price: SolAmount | SplTokenAmount;
  tokens: SplTokenAmount;
  createdAt: DateTime;
}>;

export const isPurchase = (value: any): value is Purchase =>
  typeof value === 'object' && value.model === 'purchase' && !value.lazy;

export function assertPurchase(value: any): asserts value is Purchase {
  assert(isPurchase(value), `Expected Purchase type`);
}

export const toPurchase = (
  account: PurchaseReceiptAccount,
  auctionHouseModel: AuctionHouse,
  asset: NftWithToken | SftWithToken
): Purchase => {
  const lazyPurchase = toLazyPurchase(account, auctionHouseModel);

  return {
    ...lazyPurchase,
    model: 'purchase',
    lazy: false,
    asset,
    tokens: amount(lazyPurchase.tokens, asset.mint.currency),
  };
};

export type LazyPurchase = Omit<Purchase, 'lazy' | 'asset' | 'tokens'> &
  Readonly<{
    lazy: true;
    metadataAddress: PublicKey;
    tokens: BigNumber;
  }>;

export const isLazyPurchase = (value: any): value is LazyPurchase =>
  typeof value === 'object' && value.model === 'purchase' && value.lazy;

export function assertLazyPurchase(value: any): asserts value is LazyPurchase {
  assert(isLazyPurchase(value), `Expected LazyPurchase type`);
}
export const toLazyPurchase = (
  account: PurchaseReceiptAccount,
  auctionHouseModel: AuctionHouse
): LazyPurchase => {
  return {
    model: 'purchase',
    lazy: true,
    auctionHouse: auctionHouseModel,
    buyerAddress: account.data.buyer,
    sellerAddress: account.data.seller,
    metadataAddress: account.data.metadata,
    bookkeeperAddress: account.data.bookkeeper,
    receiptAddress: account.publicKey,
    price: auctionHouseModel.isNative
      ? lamports(account.data.price)
      : amount(account.data.price, auctionHouseModel.treasuryMint.currency),
    tokens: toBigNumber(account.data.tokenSize),
    createdAt: toDateTime(account.data.createdAt),
  };
};
