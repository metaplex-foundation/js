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
  FindListingByAddressInput,
  findListingByAddressOperation,
} from './operations/findListingByAddress';
import {
  FindPurchaseByAddressInput,
  findPurchaseByAddressOperation,
} from './operations/findPurchaseByAddress';
import { LoadBidInput, loadBidOperation } from './operations/loadBid';
import { LoadPurchaseInput, loadPurchaseOperation } from './operations/loadPurchase';
import { LoadListingInput, loadListingOperation } from './operations/loadListing';
import { LazyPurchase, Purchase } from './models/Purchase';
import { LazyListing, Listing } from './models/Listing';
import { now } from '@/types';
import {
  UpdateAuctionHouseInput,
  updateAuctionHouseOperation,
  UpdateAuctionHouseOutput,
} from './operations/updateAuctionHouse';


/**
 * @group Modules
 */
export class AuctionHouseClient {
  constructor(protected readonly metaplex: Metaplex) { }

  bid(input: CreateBidInput): Task<CreateBidOutput & { bid: Bid }> {
    return new Task(async (scope) => {
      const output = await this.metaplex
        .operations()
        .execute(createBidOperation(input), scope);
      scope.throwIfCanceled();

      if (output.receipt) {
        const bid = await this.findBidByReceipt(
          input.auctionHouse,
          output.receipt
        ).run(scope);
        return { bid, ...output };
      }

      scope.throwIfCanceled();
      const lazyBid: LazyBid = {
        model: 'bid',
        lazy: true,
        auctionHouse: input.auctionHouse,
        tradeStateAddress: output.buyerTradeState,
        bookkeeperAddress: output.bookkeeper,
        tokenAddress: output.tokenAccount,
        buyerAddress: output.buyer,
        metadataAddress: output.metadata,
        receiptAddress: output.receipt,
        purchaseReceiptAddress: null,
        isPublic: Boolean(output.tokenAccount),
        price: output.price,
        tokens: output.tokens.basisPoints,
        createdAt: now(),
        canceledAt: null,
      };

      return {
        bid: await this.loadBid(lazyBid).run(scope),
        ...output,
      };
    });
  }

  builders() {
    return new AuctionHouseBuildersClient(this.metaplex);
  }

  createAuctionHouse(
    input: CreateAuctionHouseInput
  ): Task<CreateAuctionHouseOutput & { auctionHouse: AuctionHouse }> {
    return new Task(async (scope) => {
      const output = await this.metaplex
        .operations()
        .getTask(createAuctionHouseOperation(input))
        .run(scope);
      scope.throwIfCanceled();
      const auctionHouse = await this.findAuctionHouseByAddress(
        output.auctionHouseAddress,
        input.auctioneerAuthority
      ).run(scope);
      return { ...output, auctionHouse };
    });
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
    return new Task(async (scope) => {
      const output = await this.metaplex
        .operations()
        .execute(executeSaleOperation(input));
      scope.throwIfCanceled();

      try {
        const purchase = await this.findPurchaseByAddress(
          output.sellerTradeState,
          output.buyerTradeState,
          input.auctionHouse
        ).run(scope);
        return { purchase, ...output };
      } catch (error) {
        // Fallback to manually creating a purchase from inputs and outputs.
      }

      const lazyPurchase: LazyPurchase = {
        model: 'purchase',
        lazy: true,
        auctionHouse: input.auctionHouse,
        buyerAddress: output.buyer,
        sellerAddress: output.seller,
        metadataAddress: output.metadata,
        bookkeeperAddress: output.bookkeeper,
        receiptAddress: output.receipt,
        price: output.price,
        tokens: output.tokens.basisPoints,
        createdAt: now(),
      };

      return {
        purchase: await this.loadPurchase(lazyPurchase).run(scope),
        ...output,
      };
    });
  }

  findAuctionHouseByAddress(
    address: PublicKey,
    auctioneerAuthority?: PublicKey,
    options?: Omit<
      FindAuctionHouseByAddressInput,
      'address' | 'auctioneerAuthority'
    >
  ): Task<AuctionHouse> {
    return this.metaplex.operations().getTask(
      findAuctionHouseByAddressOperation({
        address,
        auctioneerAuthority,
        ...options,
      })
    );
  }

  findAuctionHouseByCreatorAndMint(
    creator: PublicKey,
    treasuryMint: PublicKey,
    auctioneerAuthority?: PublicKey,
    options?: Omit<
      FindAuctionHouseByAddressInput,
      'address' | 'auctioneerAuthority'
    >
  ): Task<AuctionHouse> {
    return this.findAuctionHouseByAddress(
      findAuctionHousePda(creator, treasuryMint),
      auctioneerAuthority,
      options
    );
  }

  findPurchaseByAddress(
    sellerTradeState: PublicKey,
    buyerTradeState: PublicKey,
    auctionHouse: AuctionHouse,
    options: Omit<
      FindPurchaseByAddressInput,
      'sellerTradeState' | 'buyerTradeState' | 'auctionHouse'
    > = {}
  ) {
    return this.metaplex.operations().getTask(
      findPurchaseByAddressOperation({
        sellerTradeState,
        buyerTradeState,
        auctionHouse,
        ...options,
      })
    );
  }

  findBidByReceipt(
    auctionHouse: AuctionHouse,
    receiptAddress: PublicKey,
    options: Omit<FindBidByReceiptInput, 'receiptAddress' | 'auctionHouse'> = {}
  ) {
    return this.metaplex.operations().getTask(
      findBidByReceiptOperation({
        receiptAddress,
        auctionHouse,
        ...options,
      })
    );
  }

  findBidByTradeState(
    tradeStateAddress: PublicKey,
    auctionHouse: AuctionHouse,
    options: Omit<
      FindBidByTradeStateInput,
      'tradeStateAddress' | 'auctionHouse'
    > = {}
  ) {
    return this.metaplex.operations().getTask(
      findBidByTradeStateOperation({
        tradeStateAddress,
        auctionHouse,
        ...options,
      })
    );
  }

  findListingByAddress(
    this: AuctionHouseClient,
    address: PublicKey,
    auctionHouse: AuctionHouse,
    options: Omit<FindListingByAddressInput, 'address' | 'auctionHouse'> = {}
  ) {
    return this.metaplex.operations().getTask(
      findListingByAddressOperation({
        address,
        auctionHouse,
        ...options,
      })
    );
  }

  list(
    input: CreateListingInput
  ): Task<CreateListingOutput & { listing: Listing }> {
    return new Task(async (scope) => {
      const output = await this.metaplex
        .operations()
        .execute(createListingOperation(input), scope);
      scope.throwIfCanceled();

      try {
        const listing = await this.findListingByAddress(
          output.sellerTradeState,
          input.auctionHouse
        ).run(scope);
        return { listing, ...output };
      } catch (error) {
        // Fallback to manually creating a listing from inputs and outputs.
      }

      scope.throwIfCanceled();
      const lazyListing: LazyListing = {
        model: 'listing',
        lazy: true,
        auctionHouse: input.auctionHouse,
        tradeStateAddress: output.sellerTradeState,
        bookkeeperAddress: output.bookkeeper,
        sellerAddress: output.seller,
        metadataAddress: output.metadata,
        receiptAddress: output.receipt,
        purchaseReceiptAddress: null,
        price: output.price,
        tokens: output.tokens.basisPoints,
        createdAt: now(),
        canceledAt: null,
      };

      return {
        listing: await this.loadListing(lazyListing).run(scope),
        ...output,
      };
    });
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
      const updatedAuctionHouse = await this.findAuctionHouseByAddress(
        auctionHouse.address,
        input.auctioneerAuthority ?? currentAuctioneerAuthority
      ).run(scope);
      return { ...output, auctionHouse: updatedAuctionHouse };
    });
  }

}
