import { cusper } from '@metaplex-foundation/mpl-auction-house';
import type { Metaplex } from '@/Metaplex';
import type { ErrorWithLogs, MetaplexPlugin } from '@/types';
import { AuctionsClient } from './AuctionsClient';
import { AuctionHouseProgram } from './program';
import {
  createAuctionHouseOperation,
  createAuctionHouseOperationHandler,
} from './createAuctionHouse';
import { createBidOperation, createBidOperationHandler } from './createBid';
import {
  createListingOperation,
  createListingOperationHandler,
} from './createListing';
import {
  executeSaleOperation,
  executeSaleOperationHandler,
} from './executeSale';
import {
  findAuctionHouseByAddressOperation,
  findAuctionHouseByAddressOperationHandler,
} from './findAuctionHouseByAddress';
import {
  findBidByAddressOperation,
  findBidByAddressOperationHandler,
} from './findBidByAddress';
import {
  findListingByAddressOperation,
  findListingByAddressOperationHandler,
} from './findListingByAddress';
import {
  updateAuctionHouseOperation,
  updateAuctionHouseOperationHandler,
} from './updateAuctionHouse';
import { loadBidOperation, loadBidOperationHandler } from './loadBid';
import {
  loadListingOperation,
  loadListingOperationHandler,
} from './loadListing';

export const auctionHouseModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    // Auction House Program.
    metaplex.programs().register({
      name: 'AuctionHouseProgram',
      address: AuctionHouseProgram.publicKey,
      errorResolver: (error: ErrorWithLogs) =>
        cusper.errorFromProgramLogs(error.logs, false),
    });

    const op = metaplex.operations();
    op.register(
      createAuctionHouseOperation,
      createAuctionHouseOperationHandler
    );
    op.register(createBidOperation, createBidOperationHandler);
    op.register(createListingOperation, createListingOperationHandler);
    op.register(executeSaleOperation, executeSaleOperationHandler);
    op.register(
      findAuctionHouseByAddressOperation,
      findAuctionHouseByAddressOperationHandler
    );
    op.register(findBidByAddressOperation, findBidByAddressOperationHandler);
    op.register(
      findListingByAddressOperation,
      findListingByAddressOperationHandler
    );
    op.register(loadBidOperation, loadBidOperationHandler);
    op.register(loadListingOperation, loadListingOperationHandler);
    op.register(
      updateAuctionHouseOperation,
      updateAuctionHouseOperationHandler
    );

    metaplex.auctions = function () {
      return new AuctionsClient(this);
    };
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    auctions(): AuctionsClient;
  }
}
