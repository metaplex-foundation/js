import { cusper } from '@metaplex-foundation/mpl-auction-house';
import type { Metaplex } from '@/Metaplex';
import type { ErrorWithLogs, MetaplexPlugin } from '@/types';
import { AuctionHouseClient } from './AuctionHouseClient';
import { AuctionHouseProgram } from './program';
import {
  cancelBidOperation,
  cancelBidOperationHandler,
  cancelListingOperation,
  cancelListingOperationHandler,
  createAuctionHouseOperation,
  createAuctionHouseOperationHandler,
  createBidOperation,
  createBidOperationHandler,
  createListingOperation,
  createListingOperationHandler,
  executeSaleOperation,
  executeSaleOperationHandler,
  findAuctionHouseByAddressOperation,
  findAuctionHouseByAddressOperationHandler,
  findAuctionHouseByCreatorAndMintOperation,
  findAuctionHouseByCreatorAndMintOperationHandler,
  findBidByReceiptOperation,
  findBidByReceiptOperationHandler,
  findBidByTradeStateOperation,
  findBidByTradeStateOperationHandler,
  findListingByReceiptOperation,
  findListingByReceiptOperationHandler,
  findListingByTradeStateOperation,
  findListingByTradeStateOperationHandler,
  findPurchaseByReceiptOperation,
  findPurchaseByReceiptOperationHandler,
  findPurchaseByTradeStateOperation,
  findPurchaseByTradeStateOperationHandler,
  loadBidOperation,
  loadBidOperationHandler,
  loadListingOperation,
  loadListingOperationHandler,
  loadPurchaseOperation,
  loadPurchaseOperationHandler,
  updateAuctionHouseOperation,
  updateAuctionHouseOperationHandler, withdrawOperation, withdrawOperationHandler,
} from './operations';

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
    op.register(withdrawOperation, withdrawOperationHandler);
    op.register(
      findAuctionHouseByAddressOperation,
      findAuctionHouseByAddressOperationHandler
    );
    op.register(
      findAuctionHouseByCreatorAndMintOperation,
      findAuctionHouseByCreatorAndMintOperationHandler
    );
    op.register(findBidByReceiptOperation, findBidByReceiptOperationHandler);
    op.register(
      findBidByTradeStateOperation,
      findBidByTradeStateOperationHandler
    );
    op.register(
      findListingByReceiptOperation,
      findListingByReceiptOperationHandler
    );
    op.register(
      findListingByTradeStateOperation,
      findListingByTradeStateOperationHandler
    );
    op.register(
      findPurchaseByReceiptOperation,
      findPurchaseByReceiptOperationHandler
    );
    op.register(
      findPurchaseByTradeStateOperation,
      findPurchaseByTradeStateOperationHandler
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
