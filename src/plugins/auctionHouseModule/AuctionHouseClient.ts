import { Metaplex } from '@/Metaplex';
import { Signer } from '@/types';
import { Task } from '@/utils';
import { Commitment, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { AuctionHouse } from './AuctionHouse';
import {
  CreateListingInput,
  createListingOperation,
  CreateListingOutput,
} from './createListing';
import { findListingByAddressOperation } from './findListingByAddress';
import { LazyListing, Listing } from './Listing';
import { loadListingOperation } from './loadListing';

type WithoutAH<T> = Omit<T, 'auctionHouse' | 'auctioneerAuthority'>;

export class AuctionHouseClient {
  constructor(
    protected readonly metaplex: Metaplex,
    protected readonly auctionHouse: AuctionHouse,
    protected readonly auctioneerAuthority?: Signer
  ) {}

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
        sellerAddress: output.wallet,
        metadataAddress: output.metadata,
        receiptAddress: input.printReceipt ? output.receipt : null,
        purchaseReceiptAddress: null,
        price: output.price,
        tokens: output.tokens.basisPoints,
        createdAt: new BN(+new Date()),
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
    options: { commitment?: Commitment; loadJsonMetadata?: boolean } = {}
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
    options: { commitment?: Commitment; loadJsonMetadata?: boolean } = {}
  ): Task<Listing> {
    return this.metaplex
      .operations()
      .getTask(loadListingOperation({ lazyListing, ...options }));
  }

  protected addAH<T>(input: WithoutAH<T>): T {
    return {
      auctionHouse: this.auctionHouse,
      auctioneerAuthority: this.auctioneerAuthority,
      ...input,
    } as unknown as T;
  }
}
