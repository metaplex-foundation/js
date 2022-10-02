import type { Metaplex } from '@/Metaplex';
import {
  DepositToBuyerAccountBuilderParams,
  depositToBuyerAccountBuilder,
  cancelBidBuilder,
  CancelBidBuilderParams,
  CancelListingBuilderParams,
  cancelListingBuilder,
  withdrawFromBuyerAccountBuilder,
  WithdrawFromBuyerAccountBuilderParams,
} from './operations';
import {
  createAuctionHouseBuilder,
  CreateAuctionHouseBuilderParams,
} from './operations/createAuctionHouse';
import {
  createBidBuilder,
  CreateBidBuilderParams,
} from './operations/createBid';
import {
  createListingBuilder,
  CreateListingBuilderParams,
} from './operations/createListing';
import {
  executeSaleBuilder,
  ExecuteSaleBuilderParams,
} from './operations/executeSale';
import {
  updateAuctionHouseBuilder,
  UpdateAuctionHouseBuilderParams,
} from './operations/updateAuctionHouse';

/**
 * This client allows you to access the underlying Transaction Builders
 * for the write operations of the Auction House module.
 *
 * @see {@link AuctionsClient}
 * @group Module Builders
 * */
export class AuctionHouseBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  /** {@inheritDoc createBidBuilder} */
  bid(input: CreateBidBuilderParams) {
    return createBidBuilder(this.metaplex, input);
  }

  /** {@inheritDoc cancelBidBuilder} */
  cancelBid(input: CancelBidBuilderParams) {
    return cancelBidBuilder(input);
  }

  /** {@inheritDoc cancelListingBuilder} */
  cancelListing(input: CancelListingBuilderParams) {
    return cancelListingBuilder(input);
  }

  /** {@inheritDoc createAuctionHouseBuilder} */
  createAuctionHouse(input: CreateAuctionHouseBuilderParams) {
    return createAuctionHouseBuilder(this.metaplex, input);
  }

  /** {@inheritDoc depositToBuyerAccountBuilder} */
  depositToBuyerAccount(input: DepositToBuyerAccountBuilderParams) {
    return depositToBuyerAccountBuilder(this.metaplex, input);
  }

  /** {@inheritDoc executeSaleBuilder} */
  executeSale(input: ExecuteSaleBuilderParams) {
    return executeSaleBuilder(this.metaplex, input);
  }

  /** {@inheritDoc createListingBuilder} */
  list(input: CreateListingBuilderParams) {
    return createListingBuilder(this.metaplex, input);
  }

  /** {@inheritDoc updateAuctionHouseBuilder} */
  updateAuctionHouse(input: UpdateAuctionHouseBuilderParams) {
    return updateAuctionHouseBuilder(this.metaplex, input);
  }

  /** {@inheritDoc withdrawFromBuyerAccountBuilder} */
  withdrawFromBuyerAccount(input: WithdrawFromBuyerAccountBuilderParams) {
    return withdrawFromBuyerAccountBuilder(this.metaplex, input);
  }
}
