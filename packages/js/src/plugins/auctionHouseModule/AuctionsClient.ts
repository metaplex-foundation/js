import type { Metaplex } from '@/Metaplex';
import { Task } from '@/utils';
import type { PublicKey } from '@solana/web3.js';
import { AuctionHouse } from './AuctionHouse';
import { AuctionsBuildersClient } from './AuctionsBuildersClient';
import { findAuctionHousePda } from './pdas';
import {
  CreateAuctionHouseInput,
  createAuctionHouseOperation,
  CreateAuctionHouseOutput,
} from './createAuctionHouse';
import {
  FindAuctionHouseByAddressInput,
  findAuctionHouseByAddressOperation,
} from './findAuctionHouseByAddress';
import {
  UpdateAuctionHouseInput,
  updateAuctionHouseOperation,
  UpdateAuctionHouseOutput,
} from './updateAuctionHouse';
import { Signer } from '@/types';
import { AuctionHouseClient } from './AuctionHouseClient';

export class AuctionsClient {
  constructor(protected readonly metaplex: Metaplex) {}

  builders() {
    return new AuctionsBuildersClient(this.metaplex);
  }

  for(auctionHouse: AuctionHouse, auctioneerAuthority?: Signer) {
    return new AuctionHouseClient(
      this.metaplex,
      auctionHouse,
      auctioneerAuthority
    );
  }

  createAuctionHouse(
    input: CreateAuctionHouseInput
  ): Task<CreateAuctionHouseOutput & { auctionHouse: AuctionHouse }> {
    return new Task(async (scope) => {
      const output = await this.metaplex
        .operations()
        .getTask(createAuctionHouseOperation(input))
        .run(scope);
      scope.throwIfCanceled();
      const auctionHouse = await this.findAuctionHouseByAddress(
        output.auctionHouseAddress
      ).run(scope);
      return { ...output, auctionHouse };
    });
  }

  updateAuctionHouse(
    auctionHouse: AuctionHouse,
    input: Omit<UpdateAuctionHouseInput, 'auctionHouse'>
  ): Task<UpdateAuctionHouseOutput & { auctionHouse: AuctionHouse }> {
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
    options?: Omit<FindAuctionHouseByAddressInput, 'address'>
  ): Task<AuctionHouse> {
    return this.metaplex
      .operations()
      .getTask(findAuctionHouseByAddressOperation({ address, ...options }));
  }

  findAuctionHouseByCreatorAndMint(
    creator: PublicKey,
    treasuryMint: PublicKey,
    options?: Omit<FindAuctionHouseByAddressInput, 'address'>
  ): Task<AuctionHouse> {
    return this.findAuctionHouseByAddress(
      findAuctionHousePda(creator, treasuryMint),
      options
    );
  }
}
