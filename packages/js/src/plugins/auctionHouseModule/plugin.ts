import { cusper } from '@metaplex-foundation/mpl-auction-house';
import type { Metaplex } from '@/Metaplex';
import type { ErrorWithLogs, MetaplexPlugin } from '@/types';
import { AuctionsClient } from './AuctionsClient';
import { AuctionHouseProgram } from './program';
import { cancelBidOperation, cancelBidOperationHandler } from './cancelBid';
import {
  cancelListingOperation,
  cancelListingOperationHandler,
} from './cancelListing';
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
  findBidByReceiptOperation,
  findBidByReceiptOperationHandler,
} from './findBidByReceipt';
import {
  findBidByTradeStateOperation,
  findBidByTradeStateOperationHandler,
} from './findBidByTradeState';
import {
  findListingByAddressOperation,
  findListingByAddressOperationHandler,
} from './findListingByAddress';
import {
  findPurchaseByAddressOperation,
  findPurchaseByAddressOperationHandler,
} from './findPurchaseByAddress';
import {
  updateAuctionHouseOperation,
  updateAuctionHouseOperationHandler,
} from './updateAuctionHouse';
import { loadBidOperation, loadBidOperationHandler } from './loadBid';
import {
  loadListingOperation,
  loadListingOperationHandler,
} from './loadListing';
import {
  loadPurchaseOperation,
  loadPurchaseOperationHandler,
} from './loadPurchase';

/** @group Plugins */
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
    op.register(cancelBidOperation, cancelBidOperationHandler);
    op.register(cancelListingOperation, cancelListingOperationHandler);
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
    op.register(findBidByReceiptOperation, findBidByReceiptOperationHandler);
    op.register(
      findBidByTradeStateOperation,
      findBidByTradeStateOperationHandler
    );
    op.register(
      findListingByAddressOperation,
      findListingByAddressOperationHandler
    );
    op.register(
      findPurchaseByAddressOperation,
      findPurchaseByAddressOperationHandler
    );
    op.register(loadBidOperation, loadBidOperationHandler);
    op.register(loadListingOperation, loadListingOperationHandler);
    op.register(loadPurchaseOperation, loadPurchaseOperationHandler);
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
