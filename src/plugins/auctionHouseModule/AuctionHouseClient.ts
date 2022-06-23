import type { Metaplex } from '@/Metaplex';
import { findAuctionHousePda } from '@/programs';
import { Task } from '@/utils';
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

  createAuctionHouse(input: CreateAuctionHouseInput): Task<
    Omit<CreateAuctionHouseOutput, 'auctionHouse'> & {
      auctionHouse: AuctionHouse;
    }
  > {
    return new Task(async (scope) => {
      const output = await this.metaplex
        .operations()
        .getTask(createAuctionHouseOperation(input))
        .run(scope);
      scope.throwIfCanceled();
      const auctionHouse = await this.findAuctionHouseByAddress(
        output.auctionHouse
      ).run(scope);
      return { ...output, auctionHouse };
    });
  }

  updateAuctionHouse(
    auctionHouse: AuctionHouse,
    input: Omit<UpdateAuctionHouseInput, 'auctionHouse'>
  ): Task<
    UpdateAuctionHouseOutput & {
      auctionHouse: AuctionHouse;
    }
  > {
    return new Task(async (scope) => {
      const output = await this.metaplex
        .operations()
        .getTask(updateAuctionHouseOperation({ auctionHouse, ...input }))
        .run(scope);
      scope.throwIfCanceled();
      const updatedAuctionHouse = await this.findAuctionHouseByAddress(
        auctionHouse.address
      ).run(scope);
      return { ...output, auctionHouse: updatedAuctionHouse };
    });
  }

  findAuctionHouseByAddress(
    address: PublicKey,
    commitment?: Commitment
  ): Task<AuctionHouse> {
    return this.metaplex
      .operations()
      .getTask(findAuctionHouseByAddressOperation({ address, commitment }));
  }

  findAuctionHouseByCreatorAndMint(
    creator: PublicKey,
    treasuryMint: PublicKey,
    commitment?: Commitment
  ): Task<AuctionHouse> {
    return this.findAuctionHouseByAddress(
      findAuctionHousePda(creator, treasuryMint),
      commitment
    );
  }
}
