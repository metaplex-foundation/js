import { Metaplex } from '@/Metaplex';
import {
  createAuctionHouseBuilder,
  CreateAuctionHouseBuilderParams,
} from './createAuctionHouse';
import {
  updateAuctionHouseBuilder,
  UpdateAuctionHouseBuilderParams,
} from './updateAuctionHouse';

export class AuctionHouseBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  createAuctionHouse(input: CreateAuctionHouseBuilderParams) {
    return createAuctionHouseBuilder(this.metaplex, input);
  }

  updateAuctionHouse(input: UpdateAuctionHouseBuilderParams) {
    return updateAuctionHouseBuilder(this.metaplex, input);
  }
}
