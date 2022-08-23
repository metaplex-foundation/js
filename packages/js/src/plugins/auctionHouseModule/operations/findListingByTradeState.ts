import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { DisposableScope } from '@/utils';
import { AuctionHouse, Listing } from '../models';
import { findListingReceiptPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'FindListingByTradeStateOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const findListingByTradeStateOperation =
  useOperation<FindListingByTradeStateOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindListingByTradeStateOperation = Operation<
  typeof Key,
  FindListingByTradeStateInput,
  Listing
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindListingByTradeStateInput = {
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
export const findListingByTradeStateOperationHandler: OperationHandler<FindListingByTradeStateOperation> =
  {
    handle: async (
      operation: FindListingByTradeStateOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const { tradeStateAddress } = operation.input;

      const receiptAddress = findListingReceiptPda(tradeStateAddress);

      return metaplex
        .auctionHouse()
        .findListingByReceipt({ receiptAddress, ...operation.input })
        .run(scope);
    },
  };
