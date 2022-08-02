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
import { assert, Option } from '@/utils';
import { AuctionHouse } from './AuctionHouse';
import { Nft, NftWithToken, Sft, SftWithToken } from '../nftModule';

export type Bid = Readonly<
  {
    model: 'bid';
    lazy: false;

    // Models.
    auctionHouse: AuctionHouse;

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
  } & (
    | {
        isPublic: false;
        asset: SftWithToken | NftWithToken;
      }
    | {
        isPublic: true;
        asset: Sft | Nft;
      }
  )
>;

export const isBid = (value: any): value is Bid =>
  typeof value === 'object' && value.model === 'bid' && !value.lazy;

export function assertBid(value: any): asserts value is Bid {
  assert(isBid(value), `Expected Bid type`);
}

export const toBid = (
  account: BidReceiptAccount,
  auctionHouse: AuctionHouse,
  asset: Nft | Sft | NftWithToken | SftWithToken
): Bid => {
  const lazyBid = toLazyBid(account, auctionHouse);

  return {
    ...lazyBid,
    model: 'bid',
    lazy: false,
    ...('token' in asset
      ? {
          asset,
          tokens: amount(lazyBid.tokens, asset.mint.currency),
          isPublic: false,
        }
      : {
          asset,
          tokens: amount(lazyBid.tokens, asset.mint.currency),
          isPublic: true,
        }),
  };
};

export type LazyBid = Omit<Bid, 'lazy' | 'asset' | 'tokens'> &
  Readonly<{
    lazy: true;
    metadataAddress: PublicKey;
    tokenAddress: Option<PublicKey>;
    tokens: BigNumber;
  }>;

export const isLazyBid = (value: any): value is LazyBid =>
  typeof value === 'object' && value.model === 'bid' && value.lazy;

export function assertLazyBid(value: any): asserts value is LazyBid {
  assert(isLazyBid(value), `Expected LazyBid type`);
}
export const toLazyBid = (
  account: BidReceiptAccount,
  auctionHouse: AuctionHouse
): LazyBid => {
  return {
    model: 'bid',
    lazy: true,
    auctionHouse,
    tradeStateAddress: new Pda(
      account.data.tradeState,
      account.data.tradeStateBump
    ),
    bookkeeperAddress: account.data.bookkeeper,
    buyerAddress: account.data.buyer,
    metadataAddress: account.data.metadata,
    tokenAddress: account.data.tokenAccount,
    receiptAddress: new Pda(account.publicKey, account.data.bump),
    purchaseReceiptAddress: account.data.purchaseReceipt,
    isPublic: Boolean(account.data.tokenAccount),

    // Data.
    price: auctionHouse.isNative
      ? lamports(account.data.price)
      : amount(account.data.price, auctionHouse.treasuryMint.currency),
    tokens: toBigNumber(account.data.tokenSize),
    createdAt: toDateTime(account.data.createdAt),
    canceledAt: toOptionDateTime(account.data.canceledAt),
  };
};
