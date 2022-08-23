import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { DisposableScope } from '@/utils';
import { findBidReceiptPda } from '../pdas';
import { AuctionHouse, Bid } from '../models';

// -----------------
// Operation
// -----------------

const Key = 'FindBidByTradeStateOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const findBidByTradeStateOperation =
  useOperation<FindBidByTradeStateOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindBidByTradeStateOperation = Operation<
  typeof Key,
  FindBidByTradeStateInput,
  Bid
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindBidByTradeStateInput = {
  tradeStateAddress: PublicKey;
  auctionHouse: AuctionHouse;
  loadJsonMetadata?: boolean; // Default: true

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Handlers
 */
export const findBidByTradeStateOperationHandler: OperationHandler<FindBidByTradeStateOperation> =
  {
    handle: async (
      operation: FindBidByTradeStateOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const { tradeStateAddress } = operation.input;

      const receiptAddress = findBidReceiptPda(tradeStateAddress);

      return metaplex
        .auctionHouse()
        .findBidByReceipt({ receiptAddress, ...operation.input })
        .run(scope);
    },
  };
