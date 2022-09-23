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
 * Finds a Listing by its trade state address.
 *
 * ```ts
 * const nft = await metaplex
 *   .auctionHouse()
 *   .findListingByTradeState({ tradeStateAddress, auctionHouse })
 *   .run();
 * ```
 *
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
  /** Seller trade state PDA account encoding the listing order. */
  tradeStateAddress: PublicKey;

  /** A model of the Auction House related to this listing. */
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
