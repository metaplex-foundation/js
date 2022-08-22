import type { Metaplex } from '@/Metaplex';
import { Task } from '@/utils';
import type { PublicKey } from '@solana/web3.js';
import { AuctionHouse } from './AuctionHouse';
import { AuctionHouseBuildersClient } from './AuctionHouseBuildersClient';
import { Bid, LazyBid } from './models/Bid';
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
import { findAuctionHousePda } from './pdas';
import {
  FindAuctionHouseByAddressInput,
  findAuctionHouseByAddressOperation,
} from './operations/findAuctionHouseByAddress';
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
  FindPurchaseByAddressInput,
  findPurchaseByAddressOperation,
} from './operations/findPurchaseByAddress';
import { LoadBidInput, loadBidOperation } from './operations/loadBid';
import {
  LoadPurchaseInput,
  loadPurchaseOperation,
} from './operations/loadPurchase';
import {
  LoadListingInput,
  loadListingOperation,
} from './operations/loadListing';
import { LazyPurchase, Purchase } from './models/Purchase';
import { LazyListing, Listing } from './models/Listing';
import {
  UpdateAuctionHouseInput,
  updateAuctionHouseOperation,
  UpdateAuctionHouseOutput,
} from './operations/updateAuctionHouse';

/**
 * @group Modules
 */
export class AuctionHouseClient {
  constructor(protected readonly metaplex: Metaplex) {}

  builders() {
    return new AuctionHouseBuildersClient(this.metaplex);
  }

  bid(input: CreateBidInput): Task<CreateBidOutput & { bid: Bid }> {
    return this.metaplex.operations().getTask(createBidOperation(input));
  }

  createAuctionHouse(
    input: CreateAuctionHouseInput
  ): Task<CreateAuctionHouseOutput & { auctionHouse: AuctionHouse }> {
    return this.metaplex
      .operations()
      .getTask(createAuctionHouseOperation(input));
  }

  cancelBid(input: CancelBidInput): Task<CancelBidOutput> {
    return this.metaplex.operations().getTask(cancelBidOperation(input));
  }

  cancelListing(input: CancelListingInput): Task<CancelListingOutput> {
    return this.metaplex.operations().getTask(cancelListingOperation(input));
  }

  executeSale(
    input: ExecuteSaleInput
  ): Task<ExecuteSaleOutput & { purchase: Purchase }> {
    return this.metaplex.operations().getTask(executeSaleOperation(input));
  }

  findAuctionHouseByAddress(
    options: FindAuctionHouseByAddressInput
  ): Task<AuctionHouse> {
    return this.metaplex.operations().getTask(
      findAuctionHouseByAddressOperation(options)
    );
  }

  findAuctionHouseByCreatorAndMint(
    options: FindAuctionHouseByAddressInput & { creator: PublicKey,
      treasuryMint: PublicKey}
  ): Task<AuctionHouse>{
    return this.findAuctionHouseByAddress({
      ...options, 
      address: findAuctionHousePda(options.creator, options.treasuryMint),
      })
    };

  findPurchaseByAddress(
    options: FindPurchaseByAddressInput
  ) {
    return this.metaplex.operations().getTask(
      findPurchaseByAddressOperation(options)
    );
  }

  findBidByReceipt(
    options: FindBidByReceiptInput
  ) {
    return this.metaplex.operations().getTask(
      findBidByReceiptOperation(options)
    );
  }

  findBidByTradeState(
    options: FindBidByTradeStateInput
  ) {
    return this.metaplex.operations().getTask(
      findBidByTradeStateOperation(options)
    );
  }

  findListingByTradeState(
    options: FindListingByTradeStateInput
  ) {
    return this.metaplex.operations().getTask(
      findListingByTradeStateOperation(options)
    );
  }

  findListingByReceipt(
    options: FindListingByReceiptInput
  ) {
    return this.metaplex.operations().getTask(
      findListingByReceiptOperation(options)
    );
  }

  list(
    input: CreateListingInput
  ): Task<CreateListingOutput & { listing: Listing }> {
    return this.metaplex.operations().getTask(createListingOperation(input));
  }

  loadBid(
    lazyBid: LazyBid,
    options: Omit<LoadBidInput, 'lazyBid'> = {}
  ): Task<Bid> {
    return this.metaplex
      .operations()
      .getTask(loadBidOperation({ lazyBid, ...options }));
  }

  loadListing(
    lazyListing: LazyListing,
    options: Omit<LoadListingInput, 'lazyListing'> = {}
  ): Task<Listing> {
    return this.metaplex
      .operations()
      .getTask(loadListingOperation({ lazyListing, ...options }));
  }

  loadPurchase(
    lazyPurchase: LazyPurchase,
    options: Omit<LoadPurchaseInput, 'lazyPurchase'> = {}
  ): Task<Purchase> {
    return this.metaplex
      .operations()
      .getTask(loadPurchaseOperation({ lazyPurchase, ...options }));
  }

  updateAuctionHouse(
    auctionHouse: AuctionHouse,
    input: Omit<UpdateAuctionHouseInput, 'auctionHouse'>
  ): Task<UpdateAuctionHouseOutput & { auctionHouse: AuctionHouse }> {
    return new Task(async (scope) => {
      const output = await this.metaplex
        .operations()
        .getTask(updateAuctionHouseOperation({ auctionHouse, ...input }))
        .run(scope);
      scope.throwIfCanceled();
      const currentAuctioneerAuthority = auctionHouse.hasAuctioneer
        ? auctionHouse.auctioneer.authority
        : undefined;
      const updatedAuctionHouse = await this.findAuctionHouseByAddress({
        address: auctionHouse.address,
        auctioneerAuthority: input.auctioneerAuthority ?? currentAuctioneerAuthority
    }).run(scope);
      return { ...output, auctionHouse: updatedAuctionHouse };
    });
  }
}
