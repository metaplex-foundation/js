import type { Metaplex } from '@/Metaplex';
import {
  createAuctionHouseBuilder,
  CreateAuctionHouseBuilderParams,
} from './createAuctionHouse';
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

  createAuctionHouse(input: CreateAuctionHouseBuilderParams) {
    return createAuctionHouseBuilder(this.metaplex, input);
  }

  updateAuctionHouse(input: UpdateAuctionHouseBuilderParams) {
    return updateAuctionHouseBuilder(this.metaplex, input);
  }

  createListing(input: CreateListingBuilderParams) {
    return createListingBuilder(this.metaplex, input);
  }
}
