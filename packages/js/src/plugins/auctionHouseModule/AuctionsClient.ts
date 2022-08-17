import type { Metaplex } from '@/Metaplex';
import { Task } from '@/utils';
import type { PublicKey } from '@solana/web3.js';
import { AuctionHouse } from './AuctionHouse';
import { AuctionsBuildersClient } from './AuctionsBuildersClient';
import { findAuctionHousePda } from './pdas';
import {
  CreateAuctionHouseInput,
  createAuctionHouseOperation,
  CreateAuctionHouseOutput,
} from './createAuctionHouse';
import {
  FindAuctionHouseByAddressInput,
  findAuctionHouseByAddressOperation,
} from './findAuctionHouseByAddress';
import {
  UpdateAuctionHouseInput,
  updateAuctionHouseOperation,
  UpdateAuctionHouseOutput,
} from './updateAuctionHouse';
import { now } from '@/types';
import {
  CancelListingInput,
  cancelListingOperation,
  CancelListingOutput,
} from './cancelListing';
import {
  CancelBidInput,
  cancelBidOperation,
  CancelBidOutput,
} from './cancelBid';
import { LazyPurchase, Purchase } from './Purchase';
import { LoadPurchaseInput, loadPurchaseOperation } from './loadPurchase';
import { LazyListing, Listing } from './Listing';
import { LoadListingInput, loadListingOperation } from './loadListing';
import { Bid, LazyBid } from './Bid';
import { LoadBidInput, loadBidOperation } from './loadBid';
import {
  CreateListingInput,
  createListingOperation,
  CreateListingOutput,
} from './createListing';
import {
  FindListingByAddressInput,
  findListingByAddressOperation,
} from './findListingByAddress';
import {
  CreateBidInput,
  createBidOperation,
  CreateBidOutput,
} from './createBid';
import {
  findBidByReceiptOperation,
  FindBidByReceiptInput,
} from './findBidByReceipt';
import {
  FindPurchaseByAddressInput,
  findPurchaseByAddressOperation,
} from './findPurchaseByAddress';
import {
  ExecuteSaleInput,
  executeSaleOperation,
  ExecuteSaleOutput,
} from './executeSale';
import {
  FindBidByTradeStateInput,
  findBidByTradeStateOperation,
} from './findBidByTradeState';

/**
 * @group Modules
 */
export class AuctionsClient {
  constructor(protected readonly metaplex: Metaplex) {}

  builders() {
    return new AuctionsBuildersClient(this.metaplex);
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

  cancelBid(input: CancelBidInput): Task<CancelBidOutput> {
    return this.metaplex.operations().getTask(cancelBidOperation(input));
  }

  cancelListing(input: CancelListingInput): Task<CancelListingOutput> {
    return this.metaplex.operations().getTask(cancelListingOperation(input));
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

  loadPurchase(
    lazyPurchase: LazyPurchase,
    options: Omit<LoadPurchaseInput, 'lazyPurchase'> = {}
  ): Task<Purchase> {
    return this.metaplex
      .operations()
      .getTask(loadPurchaseOperation({ lazyPurchase, ...options }));
  }

  loadListing(
    lazyListing: LazyListing,
    options: Omit<LoadListingInput, 'lazyListing'> = {}
  ): Task<Listing> {
    return this.metaplex
      .operations()
      .getTask(loadListingOperation({ lazyListing, ...options }));
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

  loadBid(
    lazyBid: LazyBid,
    options: Omit<LoadBidInput, 'lazyBid'> = {}
  ): Task<Bid> {
    return this.metaplex
      .operations()
      .getTask(loadBidOperation({ lazyBid, ...options }));
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

  findListingByAddress(
    this: AuctionsClient,
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
}
