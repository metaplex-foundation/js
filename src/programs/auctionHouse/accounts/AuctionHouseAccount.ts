import { AuctionHouse } from '@metaplex-foundation/mpl-auction-house/dist/src/generated';
import { Account, getAccountParsingFunction } from '@/types';

export type AuctionHouseAccount = Account<AuctionHouse>;

export const parseAuctionHouseAccount = getAccountParsingFunction(AuctionHouse);
