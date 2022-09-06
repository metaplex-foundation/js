import { Commitment, PublicKey } from '@solana/web3.js';
import { UnreachableCaseError } from '@/errors';
import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope } from '@/utils';
import { findMetadataPda } from '../../nftModule';
import { PurchaseReceiptGpaBuilder } from '../gpaBuilders';
import {
  AuctionHouse,
  Purchase,
  LazyPurchase,
  toLazyPurchase,
} from '../models';
import { AuctionHouseProgram } from '../program';
import { toPurchaseReceiptAccount } from '../accounts';

// -----------------
// Operation
// -----------------

const Key = 'FindPurchasesByPublicKeyOperation' as const;

/**
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
  type: 'buyer' | 'seller' | 'metadata' | 'mint';
  auctionHouse: AuctionHouse;
  publicKey: PublicKey;
  commitment?: Commitment;
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
      scope: DisposableScope
    ): Promise<FindPurchasesByPublicKeyFieldOutput> => {
      const { auctionHouse, type, publicKey, commitment } = operation.input;
      const accounts = AuctionHouseProgram.purchaseAccounts(
        metaplex
      ).mergeConfig({
        commitment,
      });

      let purchaseQuery: PurchaseReceiptGpaBuilder = accounts.whereAuctionHouse(
        auctionHouse.address
      );
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
            findMetadataPda(publicKey)
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
