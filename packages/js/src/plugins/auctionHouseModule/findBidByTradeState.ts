import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { AuctionHouse } from './AuctionHouse';
import { DisposableScope } from '@/utils';
import { findBidReceiptPda } from './pdas';
import { Bid, toLazyBid } from './Bid';
import { toBidReceiptAccount } from './accounts';

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
      const {
        tradeStateAddress,
        auctionHouse,
        commitment,
        loadJsonMetadata = true,
      } = operation.input;

      const receiptAddress = findBidReceiptPda(tradeStateAddress);
      const account = toBidReceiptAccount(
        await metaplex.rpc().getAccount(receiptAddress, commitment)
      );
      scope.throwIfCanceled();

      const lazyBid = toLazyBid(account, auctionHouse);
      return metaplex
        .auctions()
        .for(auctionHouse)
        .loadBid(lazyBid, { loadJsonMetadata, commitment })
        .run(scope);
    },
  };
