import { PublicKey } from '@solana/web3.js';
import { PurchaseReceiptAccount } from '../accounts';
import { NftWithToken, SftWithToken } from '../../nftModule';
import { AuctionHouse } from './AuctionHouse';
import {
  Amount,
  DateTime,
  lamports,
  toAmount,
  toBigInt,
  toDateTime,
} from '@/types';
import { assert, Option } from '@/utils';

export type Purchase = Readonly<{
  /** A model identifier to distinguish models in the SDK. */
  model: 'purchase';

  /**
   * Whether or not the asset was loaded.
   * When this is `false`, it means the Purchase includes asset model.
   */
  lazy: false;

  /** A model of the Auction House related to this purchase. */
  auctionHouse: AuctionHouse;

  /** The Nft or Sft with the associated token account. */
  asset: SftWithToken | NftWithToken;

  /** The address of the buyer's wallet. */
  buyerAddress: PublicKey;

  /** The address of the seller's wallet. */
  sellerAddress: PublicKey;

  /**
   * The address of the bookkeeper account.
   * It is responsible for signing a Purchase Receipt Print.
   */
  bookkeeperAddress: Option<PublicKey>;

  /**
   * The address of the purchase receipt account.
   * This is the account that stores information about this purchase.
   * The Purchase model is built on top of this account.
   */
  receiptAddress: Option<PublicKey>;

  /** The number of tokens spent on this purchase. */
  price: Amount;

  /** The number of tokens bought in case it's a sale of a Fungible Token. */
  tokens: Amount;

  /** The date of creation. */
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
    tokens: toAmount(lazyPurchase.tokens.toString(), ...asset.mint.currency),
  };
};

export type LazyPurchase = Omit<Purchase, 'lazy' | 'asset' | 'tokens'> &
  Readonly<{
    lazy: true;
    metadataAddress: PublicKey;
    tokens: bigint;
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
      ? lamports(account.data.price.toString())
      : toAmount(
          account.data.price.toString(),
          ...auctionHouseModel.treasuryMint.currency
        ),
    tokens: toBigInt(account.data.tokenSize.toString()),
    createdAt: toDateTime(account.data.createdAt.toString()),
  };
};
