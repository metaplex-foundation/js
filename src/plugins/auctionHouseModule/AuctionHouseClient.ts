import type { Metaplex } from '@/Metaplex';
import type { Commitment, PublicKey } from '@solana/web3.js';
import {
  CreateAuctionHouseInput,
  createAuctionHouseOperation,
  CreateAuctionHouseOutput,
} from './createAuctionHouse';
import { findAuctionHouseByAddressOperation } from './findAuctionHouseByAddress';

export class AuctionHouseClient {
  constructor(protected readonly metaplex: Metaplex) {}

  async createAuctionHouse(input: CreateAuctionHouseInput): Promise<any> {
    const { auctionHouse }: CreateAuctionHouseOutput = await this.metaplex
      .operations()
      .execute(createAuctionHouseOperation(input));

    const foo = this.findAuctionHouseByAddress(auctionHouse);

    return foo;
  }

  findAuctionHouseByAddress(address: PublicKey, commitment?: Commitment) {
    return this.metaplex
      .operations()
      .execute(findAuctionHouseByAddressOperation({ address, commitment }));
  }
}
