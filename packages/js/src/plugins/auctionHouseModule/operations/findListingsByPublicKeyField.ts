import { PublicKey } from '@solana/web3.js';
import { toListingReceiptAccount } from '../accounts';
import { ListingReceiptGpaBuilder } from '../gpaBuilders';
import { AuctionHouse, LazyListing, Listing, toLazyListing } from '../models';
import {
  Operation,
  OperationHandler,
  OperationScope,
  useOperation,
} from '@/types';
import { Metaplex } from '@/Metaplex';
import { UnreachableCaseError } from '@/errors';

// -----------------
// Operation
// -----------------

const Key = 'FindListingsByPublicKeyOperation' as const;

/**
 * Finds multiple Listings by specific criteria.
 *
 * ```ts
 * // Find listings by seller.
 * const listings = await metaplex
 *   .auctionHouse()
 *   .findListingsBy({ auctionHouse, type: 'seller', publicKey: seller };
 *
 * // Find listings by metadata.
 * const listings = await metaplex
 *   .auctionHouse()
 *   .findListingsBy({ auctionHouse, type: 'metadata', publicKey: metadata };
 *
 * // Find listings by mint.
 * const listings = await metaplex
 *   .auctionHouse()
 *   .findListingsBy({ auctionHouse, type: 'mint', publicKey: mint };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findListingsByPublicKeyFieldOperation =
  useOperation<FindListingsByPublicKeyFieldOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindListingsByPublicKeyFieldOperation = Operation<
  typeof Key,
  FindListingsByPublicKeyFieldInput,
  FindListingsByPublicKeyFieldOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindListingsByPublicKeyFieldInput = {
  /** A type of criteria to use in search. */
  type: 'seller' | 'metadata' | 'mint';

  /** A model of the Auction House related to these listings. */
  auctionHouse: AuctionHouse;

  /** The address to search for. */
  publicKey: PublicKey;
};

/**
 * @group Operations
 * @category Outputs
 */
export type FindListingsByPublicKeyFieldOutput = (Listing | LazyListing)[];

/**
 * @group Operations
 * @category Handlers
 */
export const findListingsByPublicKeyFieldOperationHandler: OperationHandler<FindListingsByPublicKeyFieldOperation> =
  {
    handle: async (
      operation: FindListingsByPublicKeyFieldOperation,
      metaplex: Metaplex,
      scope: OperationScope
    ): Promise<FindListingsByPublicKeyFieldOutput> => {
      const { commitment, programs } = scope;
      const { auctionHouse, type, publicKey } = operation.input;
      const auctionHouseProgram = metaplex.programs().getAuctionHouse();
      let listingQuery = new ListingReceiptGpaBuilder(
        metaplex,
        auctionHouseProgram.address
      )
        .mergeConfig({ commitment })
        .whereAuctionHouse(auctionHouse.address);

      switch (type) {
        case 'seller':
          listingQuery = listingQuery.whereSeller(publicKey);
          break;
        case 'metadata':
          listingQuery = listingQuery.whereMetadata(publicKey);
          break;
        case 'mint':
          listingQuery = listingQuery.whereMetadata(
            metaplex.nfts().pdas().metadata({ mint: publicKey, programs })
          );
          break;
        default:
          throw new UnreachableCaseError(type);
      }
      scope.throwIfCanceled();

      return listingQuery.getAndMap((account) =>
        toLazyListing(toListingReceiptAccount(account), auctionHouse)
      );
    },
  };
