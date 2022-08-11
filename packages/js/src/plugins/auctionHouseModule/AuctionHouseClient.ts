import { Metaplex } from '@/Metaplex';
import { Signer } from '@/types';
import { AuctionHouse } from './AuctionHouse';
import { _listClient } from './createListing';
import { _findListingByAddressClient } from './findListingByAddress';
import { _loadListingClient } from './loadListing';
import { _bidClient } from './createBid';
import { _findBidByAddressClient } from './findBidByAddress';
import { _loadBidClient } from './loadBid';
import { _executeSaleClient } from './executeSale';
import { _findPurchaseByAddressClient } from './findPurchaseByAddress';
import { _loadPurchaseClient } from './loadPurchase';
import { _cancelBidClient } from './cancelBid';
import { _cancelListingClient } from './cancelListing';

type WithoutAH<T> = Omit<T, 'auctionHouse' | 'auctioneerAuthority'>;

export class AuctionHouseClient {
  constructor(
    protected readonly metaplex: Metaplex,
    protected readonly auctionHouse: AuctionHouse,
    protected readonly auctioneerAuthority?: Signer
  ) { }

  // Queries.
  findBidByAddress = _findBidByAddressClient;
  findListingByAddress = _findListingByAddressClient;
  findPurchaseByAddress = _findPurchaseByAddressClient;

  // Create.
  bid = _bidClient;
  list = _listClient;
  executeSale = _executeSaleClient;

  // Load.
  loadBid = _loadBidClient;
  loadListing = _loadListingClient;
  loadPurchase = _loadPurchaseClient;

  // Cancel.
  cancelBid = _cancelBidClient;
  cancelListing = _cancelListingClient;

  protected addAH<T>(input: WithoutAH<T>): T {
    return {
      auctionHouse: this.auctionHouse,
      auctioneerAuthority: this.auctioneerAuthority,
      ...input,
    } as unknown as T;
  }
}
