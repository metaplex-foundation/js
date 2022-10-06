import { PublicKey } from '@solana/web3.js';
import { toPurchaseReceiptAccount } from '../accounts';
import { PurchaseReceiptGpaBuilder } from '../gpaBuilders';
import {
  AuctionHouse,
  LazyPurchase,
  Purchase,
  toLazyPurchase,
} from '../models';
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

const Key = 'FindPurchasesByPublicKeyOperation' as const;

/**
 * Finds multiple Purchases by specific criteria.
 *
 * ```ts
 * // Find purchases by seller.
 * const purchases = await metaplex
 *   .auctionHouse()
 *   .findPurchasesBy({ auctionHouse, type: 'seller', publicKey: seller };
 *
 * // Find purchases by buyer.
 * const purchases = await metaplex
 *   .auctionHouse()
 *   .findPurchasesBy({ auctionHouse, type: 'buyer', publicKey: buyer };
 *
 * // Find purchases by metadata.
 * const purchases = await metaplex
 *   .auctionHouse()
 *   .findPurchasesBy({ auctionHouse, type: 'metadata', publicKey: metadata };
 *
 * // Find purchases by mint.
 * const purchases = await metaplex
 *   .auctionHouse()
 *   .findPurchasesBy({ auctionHouse, type: 'mint', publicKey: mint };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findPurchasesByPublicKeyFieldOperation =
  useOperation<FindPurchasesByPublicKeyFieldOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindPurchasesByPublicKeyFieldOperation = Operation<
  typeof Key,
  FindPurchasesByPublicKeyFieldInput,
  FindPurchasesByPublicKeyFieldOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindPurchasesByPublicKeyFieldInput = {
  /** A type of criteria to use in search. */
  type: 'buyer' | 'seller' | 'metadata' | 'mint';

  /** A model of the Auction House related to these purchases. */
  auctionHouse: AuctionHouse;

  /** The address to search for. */
  publicKey: PublicKey;
};

/**
 * @group Operations
 * @category Outputs
 */
export type FindPurchasesByPublicKeyFieldOutput = (Purchase | LazyPurchase)[];

/**
 * @group Operations
 * @category Handlers
 */
export const findPurchasesByPublicKeyFieldOperationHandler: OperationHandler<FindPurchasesByPublicKeyFieldOperation> =
  {
    handle: async (
      operation: FindPurchasesByPublicKeyFieldOperation,
      metaplex: Metaplex,
      scope: OperationScope
    ): Promise<FindPurchasesByPublicKeyFieldOutput> => {
      const { programs, commitment } = scope;
      const { auctionHouse, type, publicKey } = operation.input;
      const auctionHouseProgram = metaplex.programs().getAuctionHouse();
      let purchaseQuery = new PurchaseReceiptGpaBuilder(
        metaplex,
        auctionHouseProgram.address
      )
        .mergeConfig({ commitment })
        .whereAuctionHouse(auctionHouse.address);

      switch (type) {
        case 'buyer':
          purchaseQuery = purchaseQuery.whereBuyer(publicKey);
          break;
        case 'seller':
          purchaseQuery = purchaseQuery.whereSeller(publicKey);
          break;
        case 'metadata':
          purchaseQuery = purchaseQuery.whereMetadata(publicKey);
          break;
        case 'mint':
          purchaseQuery = purchaseQuery.whereMetadata(
            metaplex.nfts().pdas().metadata({ mint: publicKey, programs })
          );
          break;
        default:
          throw new UnreachableCaseError(type);
      }
      scope.throwIfCanceled();

      return purchaseQuery.getAndMap((account) =>
        toLazyPurchase(toPurchaseReceiptAccount(account), auctionHouse)
      );
    },
  };
