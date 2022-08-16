import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { toPurchaseReceiptAccount } from './accounts';
import { AuctionHouse } from './AuctionHouse';
import { DisposableScope } from '@/utils';
import { Purchase, toLazyPurchase } from './Purchase';
import { findPurchaseReceiptPda } from './pdas';

// -----------------
// Operation
// -----------------

const Key = 'FindPurchaseByAddressOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const findPurchaseByAddressOperation =
  useOperation<FindPurchaseByAddressOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindPurchaseByAddressOperation = Operation<
  typeof Key,
  FindPurchaseByAddressInput,
  Purchase
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindPurchaseByAddressInput = {
  sellerTradeState: PublicKey;
  buyerTradeState: PublicKey;
  auctionHouse: AuctionHouse;
  loadJsonMetadata?: boolean; // Default: true
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Handlers
 */
export const findPurchaseByAddressOperationHandler: OperationHandler<FindPurchaseByAddressOperation> =
  {
    handle: async (
      operation: FindPurchaseByAddressOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const {
        sellerTradeState,
        buyerTradeState,
        auctionHouse,
        commitment,
        loadJsonMetadata = true,
      } = operation.input;

      const receiptAddress = findPurchaseReceiptPda(
        sellerTradeState,
        buyerTradeState
      );
      const account = toPurchaseReceiptAccount(
        await metaplex.rpc().getAccount(receiptAddress, commitment)
      );
      scope.throwIfCanceled();

      const lazyPurchase = toLazyPurchase(account, auctionHouse);
      return metaplex
        .auctions()
        .for(auctionHouse)
        .loadPurchase(lazyPurchase, { loadJsonMetadata, commitment })
        .run(scope);
    },
  };
