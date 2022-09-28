import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { DisposableScope } from '@/utils';
import { AuctionHouse, Purchase } from '../models';
import { findPurchaseReceiptPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'FindPurchaseByTradeStateOperation' as const;

/**
 * Finds a Purchase by its trade state address.
 *
 * ```ts
 * const nft = await metaplex
 *   .auctionHouse()
 *   .findPurchaseByTradeState({ sellerTradeState, buyerTradeState, auctionHouse })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findPurchaseByTradeStateOperation =
  useOperation<FindPurchaseByTradeStateOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindPurchaseByTradeStateOperation = Operation<
  typeof Key,
  FindPurchaseByTradeStateInput,
  Purchase
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindPurchaseByTradeStateInput = {
  /** Seller trade state PDA account encoding the listing order. */
  sellerTradeState: PublicKey;

  /** Buyer trade state PDA account encoding the bid order. */
  buyerTradeState: PublicKey;

  /** A model of the Auction House related to this purchase. */
  auctionHouse: AuctionHouse;

  /**
   * Whether or not we should fetch the JSON Metadata for the NFT or SFT.
   *
   * @defaultValue `true`
   */
  loadJsonMetadata?: boolean; // Default: true

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Handlers
 */
export const findPurchaseByTradeStateOperationHandler: OperationHandler<FindPurchaseByTradeStateOperation> =
  {
    handle: async (
      operation: FindPurchaseByTradeStateOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const { sellerTradeState, buyerTradeState } = operation.input;

      const receiptAddress = findPurchaseReceiptPda(
        sellerTradeState,
        buyerTradeState
      );

      return metaplex
        .auctionHouse()
        .findPurchaseByReceipt({ receiptAddress, ...operation.input })
        .run(scope);
    },
  };
