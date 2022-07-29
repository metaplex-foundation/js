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
  FindBidByAddressInput,
  findBidByAddressOperation,
} from './findBidByAddress';
import { Bid, LazyBid } from './Bid';
import { LoadBidInput, loadBidOperation } from './loadBid';
import {
  ExecuteSaleInput,
  executeSaleOperation,
  ExecuteSaleOutput,
} from './executeSale';

type WithoutAH<T> = Omit<T, 'auctionHouse' | 'auctioneerAuthority'>;

export class AuctionHouseClient {
  constructor(
    protected readonly metaplex: Metaplex,
    protected readonly auctionHouse: AuctionHouse,
    protected readonly auctioneerAuthority?: Signer
  ) {}

  executeSale(input: WithoutAH<ExecuteSaleInput>): Task<ExecuteSaleOutput> {
    return this.metaplex
      .operations()
      .getTask(executeSaleOperation(this.addAH(input)));
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
        bookkeeperAddress: input.printReceipt ? output.bookkeeper : null,
        sellerAddress: output.seller,
        metadataAddress: output.metadata,
        receiptAddress: input.printReceipt ? output.receipt : null,
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

      try {
        const bid = await this.findBidByAddress(output.buyerTradeState).run(
          scope
        );
        return { bid, ...output };
      } catch (error) {
        // Fallback to manually creating a bid from inputs and outputs.
      }

      scope.throwIfCanceled();
      const lazyBid: LazyBid = {
        model: 'bid',
        lazy: true,
        auctionHouse: this.auctionHouse,
        tradeStateAddress: output.buyerTradeState,
        bookkeeperAddress: input.printReceipt ? output.bookkeeper : null,
        tokenAddress: output.tokenAccount,
        buyerAddress: output.buyer,
        metadataAddress: output.metadata,
        receiptAddress: input.printReceipt ? output.receipt : null,
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

  findBidByAddress(
    address: PublicKey,
    options: Omit<FindBidByAddressInput, 'address' | 'auctionHouse'> = {}
  ) {
    return this.metaplex.operations().getTask(
      findBidByAddressOperation({
        address,
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
