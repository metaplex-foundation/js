import { Commitment, PublicKey } from '@solana/web3.js';
import { UnreachableCaseError } from '@/errors';
import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope } from '@/utils';
import { findMetadataPda } from '../../nftModule';
import { ListingReceiptGpaBuilder } from '../gpaBuilders';
import { AuctionHouse, LazyListing, Listing, toLazyListing } from '../models';
import { AuctionHouseProgram } from '../program';
import { toListingReceiptAccount } from '../accounts';

// -----------------
// Operation
// -----------------

const Key = 'FindListingsByPublicKeyOperation' as const;

/**
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
  type: 'seller' | 'metadata' | 'mint';
  auctionHouse: AuctionHouse;
  publicKey: PublicKey;
  commitment?: Commitment;
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
      scope: DisposableScope
    ): Promise<FindListingsByPublicKeyFieldOutput> => {
      const { auctionHouse, type, publicKey, commitment } = operation.input;
      const accounts = AuctionHouseProgram.listingAccounts(
        metaplex
      ).mergeConfig({
        commitment,
      });

      let listingQuery: ListingReceiptGpaBuilder = accounts.whereAuctionHouse(
        auctionHouse.address
      );
      switch (type) {
        case 'seller':
          listingQuery = listingQuery.whereSeller(publicKey);
          break;
        case 'metadata':
          listingQuery = listingQuery.whereMetadata(publicKey);
          break;
        case 'mint':
          listingQuery = listingQuery.whereMetadata(findMetadataPda(publicKey));
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
