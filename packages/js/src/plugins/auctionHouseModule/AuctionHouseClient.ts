import { Metaplex } from '@/Metaplex';
import { now, Signer } from '@/types';
import { Task } from '@/utils';
import { PublicKey } from '@solana/web3.js';
import { AuctionHouse } from './AuctionHouse';
import {
  CreateListingInput,
  createListingOperation,
  CreateListingOutput,
} from './createListing';
import {
  FindListingByAddressInput,
  findListingByAddressOperation,
} from './findListingByAddress';
import { LazyListing, Listing } from './Listing';
import { LoadListingInput, loadListingOperation } from './loadListing';
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
  FindBidByTradeStateInput,
  findBidByTradeStateOperation,
} from './findBidByTradeState';
import { Bid, LazyBid } from './Bid';
import { LoadBidInput, loadBidOperation } from './loadBid';
import {
  ExecuteSaleInput,
  executeSaleOperation,
  ExecuteSaleOutput,
} from './executeSale';
import {
  FindPurchaseByAddressInput,
  findPurchaseByAddressOperation,
} from './findPurchaseByAddress';
import { LazyPurchase, Purchase } from './Purchase';
import { LoadPurchaseInput, loadPurchaseOperation } from './loadPurchase';
import {
  CancelBidInput,
  cancelBidOperation,
  CancelBidOutput,
} from './cancelBid';
import {
  CancelListingInput,
  cancelListingOperation,
  CancelListingOutput,
} from './cancelListing';

type WithoutAH<T> = Omit<T, 'auctionHouse' | 'auctioneerAuthority'>;

/**
 * @group Modules
 */
export class AuctionHouseClient {
  constructor(
    protected readonly metaplex: Metaplex,
    protected readonly auctionHouse: AuctionHouse,
    protected readonly auctioneerAuthority?: Signer
  ) {}

  cancelBid(input: WithoutAH<CancelBidInput>): Task<CancelBidOutput> {
    return this.metaplex
      .operations()
      .getTask(cancelBidOperation(this.addAH(input)));
  }

  cancelListing(
    input: WithoutAH<CancelListingInput>
  ): Task<CancelListingOutput> {
    return this.metaplex
      .operations()
      .getTask(cancelListingOperation(this.addAH(input)));
  }

  executeSale(
    input: WithoutAH<ExecuteSaleInput>
  ): Task<ExecuteSaleOutput & { purchase: Purchase }> {
    return new Task(async (scope) => {
      const output = await this.metaplex
        .operations()
        .execute(executeSaleOperation(this.addAH(input)));
      scope.throwIfCanceled();

      try {
        const purchase = await this.findPurchaseByAddress(
          output.sellerTradeState,
          output.buyerTradeState
        ).run(scope);
        return { purchase, ...output };
      } catch (error) {
        // Fallback to manually creating a purchase from inputs and outputs.
      }

      const lazyPurchase: LazyPurchase = {
        model: 'purchase',
        lazy: true,
        auctionHouse: this.auctionHouse,
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

  findPurchaseByAddress(
    sellerTradeState: PublicKey,
    buyerTradeState: PublicKey,
    options: Omit<
      FindPurchaseByAddressInput,
      'sellerTradeState' | 'buyerTradeState' | 'auctionHouse'
    > = {}
  ) {
    return this.metaplex.operations().getTask(
      findPurchaseByAddressOperation({
        sellerTradeState,
        buyerTradeState,
        auctionHouse: this.auctionHouse,
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

  list(
    input: WithoutAH<CreateListingInput>
  ): Task<CreateListingOutput & { listing: Listing }> {
    return new Task(async (scope) => {
      const output = await this.metaplex
        .operations()
        .execute(createListingOperation(this.addAH(input)), scope);
      scope.throwIfCanceled();

      try {
        const listing = await this.findListingByAddress(
          output.sellerTradeState
        ).run(scope);
        return { listing, ...output };
      } catch (error) {
        // Fallback to manually creating a listing from inputs and outputs.
      }

      scope.throwIfCanceled();
      const lazyListing: LazyListing = {
        model: 'listing',
        lazy: true,
        auctionHouse: this.auctionHouse,
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
    address: PublicKey,
    options: Omit<FindListingByAddressInput, 'address' | 'auctionHouse'> = {}
  ) {
    return this.metaplex.operations().getTask(
      findListingByAddressOperation({
        address,
        auctionHouse: this.auctionHouse,
        ...options,
      })
    );
  }

  loadListing(
    lazyListing: LazyListing,
    options: Omit<LoadListingInput, 'lazyListing'> = {}
  ): Task<Listing> {
    return this.metaplex
      .operations()
      .getTask(loadListingOperation({ lazyListing, ...options }));
  }

  bid(input: WithoutAH<CreateBidInput>): Task<CreateBidOutput & { bid: Bid }> {
    return new Task(async (scope) => {
      const output = await this.metaplex
        .operations()
        .execute(createBidOperation(this.addAH(input)), scope);
      scope.throwIfCanceled();

      if (output.receipt) {
        const bid = await this.findBidByReceipt(output.receipt).run(scope);
        return { bid, ...output };
      }

      scope.throwIfCanceled();
      const lazyBid: LazyBid = {
        model: 'bid',
        lazy: true,
        auctionHouse: this.auctionHouse,
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
    receiptAddress: PublicKey,
    options: Omit<FindBidByReceiptInput, 'receiptAddress' | 'auctionHouse'> = {}
  ) {
    return this.metaplex.operations().getTask(
      findBidByReceiptOperation({
        receiptAddress,
        auctionHouse: this.auctionHouse,
        ...options,
      })
    );
  }

  findBidByTradeState(
    tradeStateAddress: PublicKey,
    options: Omit<
      FindBidByTradeStateInput,
      'tradeStateAddress' | 'auctionHouse'
    > = {}
  ) {
    return this.metaplex.operations().getTask(
      findBidByTradeStateOperation({
        tradeStateAddress,
        auctionHouse: this.auctionHouse,
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

  protected addAH<T>(input: WithoutAH<T>): T {
    return {
      auctionHouse: this.auctionHouse,
      auctioneerAuthority: this.auctioneerAuthority,
      ...input,
    } as unknown as T;
  }
}
