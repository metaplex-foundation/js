import type { Metaplex } from '@/Metaplex';
import {
  CreateAuctionHouseInput,
  createAuctionHouseOperation,
  CreateAuctionHouseOutput,
} from './createAuctionHouse';

export class AuctionHouseClient {
  constructor(protected readonly metaplex: Metaplex) {}

  createAuctionHouse(
    input: CreateAuctionHouseInput
  ): Promise<CreateAuctionHouseOutput> {
    return this.metaplex
      .operations()
      .execute(createAuctionHouseOperation(input));
  }
}
