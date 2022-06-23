import type { Metaplex } from '@/Metaplex';
import { findAuctionHousePda } from '@/programs';
import type { Commitment, PublicKey } from '@solana/web3.js';
import { AuctionHouse } from './AuctionHouse';
import { AuctionHouseBuildersClient } from './AuctionHouseBuildersClient';
import {
  CreateAuctionHouseInput,
  createAuctionHouseOperation,
  CreateAuctionHouseOutput,
} from './createAuctionHouse';
import { findAuctionHouseByAddressOperation } from './findAuctionHouseByAddress';
import {
  UpdateAuctionHouseInput,
  updateAuctionHouseOperation,
  UpdateAuctionHouseOutput,
} from './updateAuctionHouse';

export class AuctionHouseClient {
  constructor(protected readonly metaplex: Metaplex) {}

  builders() {
    return new AuctionHouseBuildersClient(this.metaplex);
  }

  async createAuctionHouse(input: CreateAuctionHouseInput): Promise<
    Omit<CreateAuctionHouseOutput, 'auctionHouse'> & {
      auctionHouse: AuctionHouse;
    }
  > {
    const output = await this.metaplex
      .operations()
      .execute(createAuctionHouseOperation(input));

    const auctionHouse = await this.findAuctionHouseByAddress(
      output.auctionHouse
    );

    return { ...output, auctionHouse };
  }

  async updateAuctionHouse(
    auctionHouse: AuctionHouse,
    input: Omit<UpdateAuctionHouseInput, 'auctionHouse'>
  ): Promise<
    UpdateAuctionHouseOutput & {
      auctionHouse: AuctionHouse;
    }
  > {
    const output = await this.metaplex
      .operations()
      .execute(updateAuctionHouseOperation({ auctionHouse, ...input }));

    const updatedAuctionHouse = await this.findAuctionHouseByAddress(
      auctionHouse.address
    );

    return { ...output, auctionHouse: updatedAuctionHouse };
  }

  findAuctionHouseByAddress(
    address: PublicKey,
    commitment?: Commitment
  ): Promise<AuctionHouse> {
    return this.metaplex
      .operations()
      .execute(findAuctionHouseByAddressOperation({ address, commitment }));
  }

  findAuctionHouseByCreatorAndMint(
    creator: PublicKey,
    treasuryMint: PublicKey,
    commitment?: Commitment
  ): Promise<AuctionHouse> {
    return this.findAuctionHouseByAddress(
      findAuctionHousePda(creator, treasuryMint),
      commitment
    );
  }
}
