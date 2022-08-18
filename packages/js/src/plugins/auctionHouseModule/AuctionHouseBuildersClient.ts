import type { Metaplex } from '@/Metaplex';
import {
  createAuctionHouseBuilder,
  CreateAuctionHouseBuilderParams,
} from './operations/createAuctionHouse';
import {
  createBidBuilder,
  CreateBidBuilderParams,
} from './operations/createBid';
import {
  createListingBuilder,
  CreateListingBuilderParams,
} from './operations/createListing';
import {
  executeSaleBuilder,
  ExecuteSaleBuilderParams,
} from './operations/executeSale';
import {
  updateAuctionHouseBuilder,
  UpdateAuctionHouseBuilderParams,
} from './operations/updateAuctionHouse';

/**
 * @group Module Builders
 */
export class AuctionHouseBuildersClient {
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

  executeSale(input: ExecuteSaleBuilderParams) {
    return executeSaleBuilder(this.metaplex, input);
  }

  updateAuctionHouse(input: UpdateAuctionHouseBuilderParams) {
    return updateAuctionHouseBuilder(this.metaplex, input);
  }
}
