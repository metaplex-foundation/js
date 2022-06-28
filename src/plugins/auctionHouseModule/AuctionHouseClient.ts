import type { Commitment } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Signer } from '@/types';
import { Task } from '@/utils';
import { AuctionHouse } from './AuctionHouse';
import {
  CreateListingInput,
  createListingOperation,
  CreateListingOutput,
} from './createListing';
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
    const operation = createListingOperation(this.addAH(input));

    return this.metaplex.operations().getTask(operation);
  }

  loadListing(
    lazyListing: LazyListing,
    commitment?: Commitment
  ): Task<Listing> {
    const operation = loadListingOperation({ lazyListing, commitment });

    return this.metaplex.operations().getTask(operation);
  }

  protected addAH<T>(input: WithoutAH<T>): T {
    return {
      auctionHouse: this.auctionHouse,
      auctioneerAuthority: this.auctioneerAuthority,
      ...input,
    } as unknown as T;
  }
}
