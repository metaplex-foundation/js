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
 * Finds a Bid by its trade state address.
 *
 * ```ts
 * const nft = await metaplex
 *   .auctionHouse()
 *   .findBidByTradeState({ tradeStateAddress, auctionHouse })
 *   .run();
 * ```
 *
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
  /** Buyer trade state PDA account encoding the bid order. */
  tradeStateAddress: PublicKey;

  /** A model of the Auction House related to this bid. */
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
