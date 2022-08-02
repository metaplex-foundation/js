import type { Metaplex } from '@/Metaplex';
import {
  createAuctionHouseBuilder,
  CreateAuctionHouseBuilderParams,
} from './createAuctionHouse';
import { createBidBuilder, CreateBidBuilderParams } from './createBid';
import {
  createListingBuilder,
  CreateListingBuilderParams,
} from './createListing';
import {
  updateAuctionHouseBuilder,
  UpdateAuctionHouseBuilderParams,
} from './updateAuctionHouse';

export class AuctionsBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  bid(input: CreateBidBuilderParams) {
    return createBidBuilder(this.metaplex, input);
  }

  createAuctionHouse(input: CreateAuctionHouseBuilderParams) {
    return createAuctionHouseBuilder(this.metaplex, input);
  }

  list(input: CreateListingBuilderParams) {
    return createListingBuilder(this.metaplex, input);
  }

  updateAuctionHouse(input: UpdateAuctionHouseBuilderParams) {
    return updateAuctionHouseBuilder(this.metaplex, input);
  }
}
