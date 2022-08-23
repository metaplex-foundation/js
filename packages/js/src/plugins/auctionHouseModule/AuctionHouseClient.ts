import type { Metaplex } from '@/Metaplex';
import { Task } from '@/utils';
import { AuctionHouse, Bid, Listing, Purchase } from './models';
import { AuctionHouseBuildersClient } from './AuctionHouseBuildersClient';
import {
  CreateAuctionHouseInput,
  createAuctionHouseOperation,
  CreateAuctionHouseOutput,
} from './operations/createAuctionHouse';
import {
  CreateBidInput,
  createBidOperation,
  CreateBidOutput,
} from './operations/createBid';
import {
  CancelBidInput,
  cancelBidOperation,
  CancelBidOutput,
} from './operations/cancelBid';
import {
  CreateListingInput,
  createListingOperation,
  CreateListingOutput,
} from './operations/createListing';
import {
  CancelListingInput,
  cancelListingOperation,
  CancelListingOutput,
} from './operations/cancelListing';
import {
  ExecuteSaleInput,
  executeSaleOperation,
  ExecuteSaleOutput,
} from './operations/executeSale';
import {
  FindAuctionHouseByAddressInput,
  findAuctionHouseByAddressOperation,
} from './operations/findAuctionHouseByAddress';
import {
  FindAuctionHouseByCreatorAndMintInput,
  findAuctionHouseByCreatorAndMintOperation,
} from './operations/findAuctionHouseByCreatorAndMint';
import {
  findBidByReceiptOperation,
  FindBidByReceiptInput,
} from './operations/findBidByReceipt';
import {
  FindBidByTradeStateInput,
  findBidByTradeStateOperation,
} from './operations/findBidByTradeState';
import {
  FindListingByReceiptInput,
  findListingByReceiptOperation,
} from './operations/findListingByReceipt';
import {
  FindListingByTradeStateInput,
  findListingByTradeStateOperation,
} from './operations/findListingByTradeState';
import {
  FindPurchaseByTradeStateInput,
  findPurchaseByTradeStateOperation,
} from './operations/findPurchaseByTradeState';
import {
  FindPurchaseByReceiptInput,
  findPurchaseByReceiptOperation,
} from './operations/findPurchaseByReceipt';
import {
  LoadPurchaseInput,
  loadPurchaseOperation,
} from './operations/loadPurchase';
import {
  LoadListingInput,
  loadListingOperation,
} from './operations/loadListing';
import {
  UpdateAuctionHouseInput,
  updateAuctionHouseOperation,
  UpdateAuctionHouseOutput,
} from './operations/updateAuctionHouse';
import { LoadBidInput, loadBidOperation } from './operations/loadBid';

/**
 * @group Modules
 */
export class AuctionHouseClient {
  constructor(protected readonly metaplex: Metaplex) {}

  /**
   * You may use the `builders()` client to access the
   * underlying Transaction Builders of this module.
   *
   * ```ts
   * const buildersClient = metaplex.auctions().builders();
   * ```
   */
  builders() {
    return new AuctionHouseBuildersClient(this.metaplex);
  }

  /** {@inheritDoc createBidOperation} */
  bid(input: CreateBidInput): Task<CreateBidOutput> {
    return this.metaplex.operations().getTask(createBidOperation(input));
  }

  /** {@inheritDoc createAuctionHouseOperation} */
  createAuctionHouse(
    input: CreateAuctionHouseInput
  ): Task<CreateAuctionHouseOutput> {
    return this.metaplex
      .operations()
      .getTask(createAuctionHouseOperation(input));
  }

  /** {@inheritDoc cancelBidOperation} */
  cancelBid(input: CancelBidInput): Task<CancelBidOutput> {
    return this.metaplex.operations().getTask(cancelBidOperation(input));
  }

  /** {@inheritDoc cancelListingOperation} */
  cancelListing(input: CancelListingInput): Task<CancelListingOutput> {
    return this.metaplex.operations().getTask(cancelListingOperation(input));
  }

  /** {@inheritDoc executeSaleOperation} */
  executeSale(input: ExecuteSaleInput): Task<ExecuteSaleOutput> {
    return this.metaplex.operations().getTask(executeSaleOperation(input));
  }

  /** {@inheritDoc findAuctionHouseByAddressOperation} */
  findAuctionHouseByAddress(
    options: FindAuctionHouseByAddressInput
  ): Task<AuctionHouse> {
    return this.metaplex
      .operations()
      .getTask(findAuctionHouseByAddressOperation(options));
  }

  /** {@inheritDoc findAuctionHouseByCreatorAndMintOperation} */
  findAuctionHouseByCreatorAndMint(
    options: FindAuctionHouseByCreatorAndMintInput
  ): Task<AuctionHouse> {
    return this.metaplex
      .operations()
      .getTask(findAuctionHouseByCreatorAndMintOperation(options));
  }

  /** {@inheritDoc findBidByReceiptOperation} */
  findBidByReceipt(options: FindBidByReceiptInput) {
    return this.metaplex
      .operations()
      .getTask(findBidByReceiptOperation(options));
  }

  /** {@inheritDoc findBidByTradeStateOperation} */
  findBidByTradeState(options: FindBidByTradeStateInput) {
    return this.metaplex
      .operations()
      .getTask(findBidByTradeStateOperation(options));
  }

  /** {@inheritDoc findListingByTradeStateOperation} */
  findListingByTradeState(options: FindListingByTradeStateInput) {
    return this.metaplex
      .operations()
      .getTask(findListingByTradeStateOperation(options));
  }

  /** {@inheritDoc findListingByReceiptOperation} */
  findListingByReceipt(options: FindListingByReceiptInput) {
    return this.metaplex
      .operations()
      .getTask(findListingByReceiptOperation(options));
  }

  /** {@inheritDoc findPurchaseByTradeStateOperation} */
  findPurchaseByTradeState(options: FindPurchaseByTradeStateInput) {
    return this.metaplex
      .operations()
      .getTask(findPurchaseByTradeStateOperation(options));
  }

  /** {@inheritDoc findPurchaseByReceiptOperation} */
  findPurchaseByReceipt(options: FindPurchaseByReceiptInput) {
    return this.metaplex
      .operations()
      .getTask(findPurchaseByReceiptOperation(options));
  }

  /** {@inheritDoc createListingOperation} */
  list(input: CreateListingInput): Task<CreateListingOutput> {
    return this.metaplex.operations().getTask(createListingOperation(input));
  }

  /** {@inheritDoc loadBidOperation} */
  loadBid(options: LoadBidInput): Task<Bid> {
    return this.metaplex.operations().getTask(loadBidOperation(options));
  }

  /** {@inheritDoc loadListingOperation} */
  loadListing(options: LoadListingInput): Task<Listing> {
    return this.metaplex.operations().getTask(loadListingOperation(options));
  }

  /** {@inheritDoc loadPurchaseOperation} */
  loadPurchase(options: LoadPurchaseInput): Task<Purchase> {
    return this.metaplex.operations().getTask(loadPurchaseOperation(options));
  }

  /** {@inheritDoc updateAuctionHouseOperation} */
  updateAuctionHouse(
    options: UpdateAuctionHouseInput
  ): Task<UpdateAuctionHouseOutput> {
    return this.metaplex
      .operations()
      .getTask(updateAuctionHouseOperation(options));
  }
}
