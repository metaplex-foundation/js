import type { Metaplex } from '@/Metaplex';
import { Task } from '@/utils';
import type { PublicKey } from '@solana/web3.js';
import { Auctioneer } from './Auctioneer';
import { AuctionHouse } from './AuctionHouse';
import { AuctionsBuildersClient } from './AuctionsBuildersClient';
import { findAuctioneerPda, findAuctionHousePda } from './pdas';
import {
  CreateAuctionHouseInput,
  createAuctionHouseOperation,
  CreateAuctionHouseOutput,
} from './createAuctionHouse';
import {
  FindAuctioneerByAddressInput,
  findAuctioneerByAddressOperation,
} from './findAuctioneerByAddress';
import {
  FindAuctionHouseByAddressInput,
  findAuctionHouseByAddressOperation,
} from './findAuctionHouseByAddress';
import {
  UpdateAuctionHouseInput,
  updateAuctionHouseOperation,
  UpdateAuctionHouseOutput,
} from './updateAuctionHouse';
import { AuctionHouseClient } from './AuctionHouseClient';
import { Signer } from '@/types';

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
  ): Task<
    UpdateAuctionHouseOutput & {
      auctionHouse: AuctionHouse;
      auctioneer: Auctioneer | null;
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

      let auctioneer = null;
      if (input.auctioneerAuthority) {
        const ahAuctioneerPda = findAuctioneerPda(
          auctionHouse.address,
          input.newAuctioneerAuthority ?? input.auctioneerAuthority
        );

        auctioneer = await this.metaplex
          .auctions()
          .findAuctioneerByAddress(ahAuctioneerPda)
          .run();
      }

      return { ...output, auctionHouse: updatedAuctionHouse, auctioneer };
    });
  }

  findAuctioneerByAddress(
    address: PublicKey,
    options?: Omit<FindAuctioneerByAddressInput, 'address'>
  ): Task<Auctioneer> {
    return this.metaplex
      .operations()
      .getTask(findAuctioneerByAddressOperation({ address, ...options }));
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
