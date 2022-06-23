import type { Metaplex } from '@/Metaplex';
import type { MetaplexPlugin } from '@/types';
import { AuctionHouseClient } from './AuctionHouseClient';
import {
  createAuctionHouseOperation,
  createAuctionHouseOperationHandler,
} from './createAuctionHouse';
import {
  findAuctionHouseByAddressOperation,
  findAuctionHouseByAddressOperationHandler,
} from './findAuctionHouseByAddress';
import {
  updateAuctionHouseOperation,
  updateAuctionHouseOperationHandler,
} from './updateAuctionHouse';

export const auctionHouseModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const op = metaplex.operations();
    op.register(
      createAuctionHouseOperation,
      createAuctionHouseOperationHandler
    );
    op.register(
      updateAuctionHouseOperation,
      updateAuctionHouseOperationHandler
    );
    op.register(
      findAuctionHouseByAddressOperation,
      findAuctionHouseByAddressOperationHandler
    );

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
