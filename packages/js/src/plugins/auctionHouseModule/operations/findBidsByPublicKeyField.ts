import { PublicKey } from '@solana/web3.js';
import { BidReceiptGpaBuilder } from '../gpaBuilders';
import { AuctionHouse, Bid, LazyBid, toLazyBid } from '../models';
import { toBidReceiptAccount } from '../accounts';
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

const Key = 'FindBidsByPublicKeyOperation' as const;

/**
 * Finds multiple Bids by specific criteria.
 *
 * ```ts
 * // Find bids by buyer.
 * const bids = await metaplex
 *   .auctionHouse()
 *   .findBidsBy({ auctionHouse, type: 'buyer', publicKey: buyer };
 *
 * // Find bids by metadata.
 * const bids = await metaplex
 *   .auctionHouse()
 *   .findBidsBy({ auctionHouse, type: 'metadata', publicKey: metadata };
 *
 * // Find bids by mint.
 * const bids = await metaplex
 *   .auctionHouse()
 *   .findBidsBy({ auctionHouse, type: 'mint', publicKey: mint };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findBidsByPublicKeyFieldOperation =
  useOperation<FindBidsByPublicKeyFieldOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindBidsByPublicKeyFieldOperation = Operation<
  typeof Key,
  FindBidsByPublicKeyFieldInput,
  FindBidsByPublicKeyFieldOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindBidsByPublicKeyFieldInput = {
  /** A type of criteria to use in search. */
  type: 'buyer' | 'metadata' | 'mint';

  /** A model of the Auction House related to these bids. */
  auctionHouse: AuctionHouse;

  /** The address to search for. */
  publicKey: PublicKey;
};

/**
 * @group Operations
 * @category Outputs
 */
export type FindBidsByPublicKeyFieldOutput = (LazyBid | Bid)[];

/**
 * @group Operations
 * @category Handlers
 */
export const findBidsByPublicKeyFieldOperationHandler: OperationHandler<FindBidsByPublicKeyFieldOperation> =
  {
    handle: async (
      operation: FindBidsByPublicKeyFieldOperation,
      metaplex: Metaplex,
      scope: OperationScope
    ): Promise<FindBidsByPublicKeyFieldOutput> => {
      const { programs, commitment } = scope;
      const { auctionHouse, type, publicKey } = operation.input;

      const auctionHouseProgram = metaplex.programs().getAuctionHouse();
      let bidQuery = new BidReceiptGpaBuilder(
        metaplex,
        auctionHouseProgram.address
      )
        .mergeConfig({ commitment })
        .whereAuctionHouse(auctionHouse.address);

      switch (type) {
        case 'buyer':
          bidQuery = bidQuery.whereBuyer(publicKey);
          break;
        case 'metadata':
          bidQuery = bidQuery.whereMetadata(publicKey);
          break;
        case 'mint':
          bidQuery = bidQuery.whereMetadata(
            metaplex.nfts().pdas().metadata({ mint: publicKey, programs })
          );
          break;
        default:
          throw new UnreachableCaseError(type);
      }
      scope.throwIfCanceled();

      return bidQuery.getAndMap((account) =>
        toLazyBid(toBidReceiptAccount(account), auctionHouse)
      );
    },
  };
