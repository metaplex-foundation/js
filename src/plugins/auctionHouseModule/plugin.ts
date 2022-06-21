import type { Metaplex } from '@/Metaplex';
import type { MetaplexPlugin } from '@/types';
import { AuctionHouseClient } from './AuctionHouseClient';

export const nftModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    // const op = metaplex.operations();

    metaplex.auctions = function () {
      return new AuctionHouseClient(this);
    };
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    auctions(): AuctionHouseClient;
  }
}
