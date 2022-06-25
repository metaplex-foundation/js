import { Metaplex } from '@/Metaplex';
import { Signer } from '@/types';
import { AuctionHouse } from './AuctionHouse';

export class AuctionHouseClient {
  constructor(
    protected readonly metaplex: Metaplex,
    protected readonly auctionHouse: AuctionHouse,
    protected readonly auctioneerAuthority?: Signer
  ) {}

  //
}
