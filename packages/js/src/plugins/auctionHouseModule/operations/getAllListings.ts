import { toListingReceiptAccount } from '../accounts';
import { ListingReceiptGpaBuilder } from '../gpaBuilders';
import { AuctionHouse, LazyListing, Listing, toLazyListing } from '../models';
import { Operation, OperationHandler, OperationScope, useOperation } from '@/types';
import { Metaplex } from '@/Metaplex';

// -----------------
// Operation
// -----------------

const Key = 'GetAllListingsInAuctionHouse' as const;

/**
 * Finds all Listings in the current Auction House.
 *
 * ```ts
 * // Get all listings.
 * const listings = await metaplex
 *   .auctionHouse()
 *   .getListings();
 *
 * @group Operations
 * @category Constructors
 */
export const getAllListingsInAuctionHouseOperation =
  useOperation<GetAllListingsInAuctionHouseOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type GetAllListingsInAuctionHouseOperation = Operation<
  typeof Key,
  GetAllListingsInAuctionHouseOperationInput,
  GetAllListingsInAuctionHouseOperationOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type GetAllListingsInAuctionHouseOperationInput = {
  /** A model of the Auction House from which all listings will got */
  auctionHouse: AuctionHouse;
};

/**
 * @group Operations
 * @category Outputs
 */
export type GetAllListingsInAuctionHouseOperationOutput = (Listing | LazyListing)[];

/**
 * @group Operations
 * @category Handlers
 */
export const getAllListingsInAuctionHouseOperationHandler: OperationHandler<GetAllListingsInAuctionHouseOperation> =
  {
    handle: async (
      operation: GetAllListingsInAuctionHouseOperation,
      metaplex: Metaplex,
      scope: OperationScope
    ): Promise<GetAllListingsInAuctionHouseOperationOutput> => {
      const { commitment } = scope;
      const { auctionHouse } = operation.input;
      const auctionHouseProgram = metaplex.programs().getAuctionHouse();
      const listingQuery = new ListingReceiptGpaBuilder(
        metaplex,
        auctionHouseProgram.address
      )
        .mergeConfig({ commitment })
        .whereAuctionHouse(auctionHouse.address);

      return listingQuery.getAndMap((account) =>
        toLazyListing(toListingReceiptAccount(account), auctionHouse)
      );
    },
  };
