import { Commitment, PublicKey } from '@solana/web3.js';
import { UnreachableCaseError } from '@/errors';
import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope } from '@/utils';
import { findMetadataPda } from '../../nftModule';
import { BidReceiptGpaBuilder } from '../gpaBuilders';
import { AuctionHouse, Bid, LazyBid, toLazyBid } from '../models';
import { AuctionHouseProgram } from '../program';
import { toBidReceiptAccount } from '../accounts';

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
 *   .findBidsBy({ auctionHouse, type: 'buyer', publicKey: buyer })
 *   .run();
 *
 * // Find bids by metadata.
 * const bids = await metaplex
 *   .auctionHouse()
 *   .findBidsBy({ auctionHouse, type: 'metadata', publicKey: metadata })
 *   .run();
 *
 * // Find bids by mint.
 * const bids = await metaplex
 *   .auctionHouse()
 *   .findBidsBy({ auctionHouse, type: 'mint', publicKey: mint })
 *   .run();
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

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
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
      scope: DisposableScope
    ): Promise<FindBidsByPublicKeyFieldOutput> => {
      const { auctionHouse, type, publicKey, commitment } = operation.input;
      const accounts = AuctionHouseProgram.bidAccounts(metaplex).mergeConfig({
        commitment,
      });

      let bidQuery: BidReceiptGpaBuilder = accounts.whereAuctionHouse(
        auctionHouse.address
      );
      switch (type) {
        case 'buyer':
          bidQuery = bidQuery.whereBuyer(publicKey);
          break;
        case 'metadata':
          bidQuery = bidQuery.whereMetadata(publicKey);
          break;
        case 'mint':
          bidQuery = bidQuery.whereMetadata(findMetadataPda(publicKey));
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
