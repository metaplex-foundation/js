import { Metaplex } from '@/Metaplex';
import { Signer } from '@/types';
import { Task } from '@/utils';
import { AuctionHouse } from './AuctionHouse';
import {
  CreateListingInput,
  createListingOperation,
  CreateListingOutput,
} from './createListing';

type WithoutAH<T> = Omit<T, 'auctionHouse' | 'auctioneerAuthority'>;

export class AuctionHouseClient {
  constructor(
    protected readonly metaplex: Metaplex,
    protected readonly auctionHouse: AuctionHouse,
    protected readonly auctioneerAuthority?: Signer
  ) {}

  list(input: WithoutAH<CreateListingInput>): Task<CreateListingOutput> {
    const operation = createListingOperation(this.addAH(input));

    return this.metaplex.operations().getTask(operation);
  }

  protected addAH<T>(input: WithoutAH<T>): T {
    return {
      auctionHouse: this.auctionHouse,
      auctioneerAuthority: this.auctioneerAuthority,
      ...input,
    } as unknown as T;
  }
}
