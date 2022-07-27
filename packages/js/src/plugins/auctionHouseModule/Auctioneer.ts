import type { PublicKey } from '@solana/web3.js';
import { assert } from '@/utils';
import { AuctioneerAccount } from './accounts';

export type Auctioneer = Readonly<{
  model: 'auctioneer';
  auctioneerAuthority: PublicKey;
  auctionHouse: PublicKey;
  scopes: boolean[];
}>;

export const isAuctioneer = (value: any): value is Auctioneer =>
  typeof value === 'object' && value.model === 'auctioneer';

export function assertAuctioneer(value: any): asserts value is Auctioneer {
  assert(isAuctioneer(value), `Expected Auctioneer type`);
}
export const toAuctioneer = (
  auctioneerAccount: AuctioneerAccount
): Auctioneer => ({
  model: 'auctioneer',
  auctioneerAuthority: auctioneerAccount.data.auctioneerAuthority,
  auctionHouse: auctioneerAccount.data.auctionHouse,
  scopes: auctioneerAccount.data.scopes,
});
