import type { PublicKey } from '@solana/web3.js';
import { AuthorityScope } from '@metaplex-foundation/mpl-auction-house';
import { assert } from '@/utils';
import { AuctioneerAccount } from './accounts';

export type Auctioneer = Readonly<{
  model: 'auctioneer';
  auctioneerAuthority: PublicKey;
  auctionHouse: PublicKey;
  scopes: AuthorityScope[];
}>;

export const isAuctioneer = (value: any): value is Auctioneer =>
  typeof value === 'object' && value.model === 'auctioneer';

export function assertAuctioneer(value: any): asserts value is Auctioneer {
  assert(isAuctioneer(value), `Expected Auctioneer type`);
}
export const toAuctioneer = (
  auctioneerAccount: AuctioneerAccount
): Auctioneer => {
  // Convert an array of booleans to a list of allowed scopes to be consistent with instruction input.
  const scopes = auctioneerAccount.data.scopes.reduce<number[]>(
    (acc, isAllowed, index) => (isAllowed ? [...acc, index] : acc),
    [] as number[]
  );

  return {
    model: 'auctioneer',
    auctioneerAuthority: auctioneerAccount.data.auctioneerAuthority,
    auctionHouse: auctioneerAccount.data.auctionHouse,
    scopes,
  };
};
