import { cusper } from '@metaplex-foundation/mpl-auction-house';
import type { Metaplex } from '@/Metaplex';
import type { ErrorWithLogs, MetaplexPlugin } from '@/types';
import { AuctionHouseClient } from './AuctionHouseClient';
import { AuctionHouseProgram } from './program';
import { cancelBidOperation, cancelBidOperationHandler } from './operations/cancelBid';
import {
  cancelListingOperation,
  cancelListingOperationHandler,
} from './operations/cancelListing';
import {
  createAuctionHouseOperation,
  createAuctionHouseOperationHandler,
} from './operations/createAuctionHouse';
import { createBidOperation, createBidOperationHandler } from './operations/createBid';
import {
  createListingOperation,
  createListingOperationHandler,
} from './operations/createListing';
import {
  executeSaleOperation,
  executeSaleOperationHandler,
} from './operations/executeSale';
import {
  findAuctionHouseByAddressOperation,
  findAuctionHouseByAddressOperationHandler,
} from './operations/findAuctionHouseByAddress';
import {
  findBidByReceiptOperation,
  findBidByReceiptOperationHandler,
} from './operations/findBidByReceipt';
import {
  findBidByTradeStateOperation,
  findBidByTradeStateOperationHandler,
} from './operations/findBidByTradeState';
import {
  findListingByAddressOperation,
  findListingByAddressOperationHandler,
} from './operations/findListingByAddress';
import {
  findPurchaseByAddressOperation,
  findPurchaseByAddressOperationHandler,
} from './operations/findPurchaseByAddress';
import {
  updateAuctionHouseOperation,
  updateAuctionHouseOperationHandler,
} from './operations/updateAuctionHouse';
import { loadBidOperation, loadBidOperationHandler } from './operations/loadBid';
import {
  loadListingOperation,
  loadListingOperationHandler,
} from './operations/loadListing';
import {
  loadPurchaseOperation,
  loadPurchaseOperationHandler,
} from './operations/loadPurchase';

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

    metaplex.auctionHouse = function () {
      return new AuctionHouseClient(this);
    };
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    auctionHouse(): AuctionHouseClient;
  }
}
