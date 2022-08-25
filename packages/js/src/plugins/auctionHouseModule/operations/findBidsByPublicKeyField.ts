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
  (LazyBid | Bid)[]
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindBidsByPublicKeyFieldInput = {
  type: 'buyer' | 'metadata' | 'mint';
  auctionHouse: AuctionHouse;
  publicKey: PublicKey;
  lazy?: boolean;
  commitment?: Commitment;
};

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
    ): Promise<(LazyBid | Bid)[]> => {
      const {
        auctionHouse,
        type,
        publicKey,
        commitment,
        lazy = true,
      } = operation.input;
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

      if (lazy) {
        return bidQuery.getAndMap((account) =>
          toLazyBid(toBidReceiptAccount(account), auctionHouse)
        );
      }

      return await Promise.all(
        await bidQuery.getAndMap((account) =>
          metaplex
            .auctionHouse()
            .loadBid({
              lazyBid: toLazyBid(toBidReceiptAccount(account), auctionHouse),
            })
            .run(scope)
        )
      );
    },
  };
