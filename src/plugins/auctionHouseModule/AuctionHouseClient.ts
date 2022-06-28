import { Metaplex } from '@/Metaplex';
import { Signer } from '@/types';
import { Task } from '@/utils';
import { Commitment, PublicKey } from '@solana/web3.js';
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

  list(input: WithoutAH<CreateListingInput>): Task<CreateListingOutput> {
    return this.metaplex
      .operations()
      .getTask(createListingOperation(this.addAH(input)));
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
