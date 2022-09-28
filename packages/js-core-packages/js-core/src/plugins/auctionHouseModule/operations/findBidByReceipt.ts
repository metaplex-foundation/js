import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { DisposableScope } from '@/utils';
import { AuctionHouse, Bid, toLazyBid } from '../models';
import { toBidReceiptAccount } from '../accounts';

// -----------------
// Operation
// -----------------

const Key = 'FindBidByReceiptOperation' as const;

/**
 * Finds a Bid by its receipt address.
 *
 * ```ts
 * const nft = await metaplex
 *   .auctionHouse()
 *   .findBidByReceipt({ receiptAddress, auctionHouse })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findBidByReceiptOperation =
  useOperation<FindBidByReceiptOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindBidByReceiptOperation = Operation<
  typeof Key,
  FindBidByReceiptInput,
  Bid
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindBidByReceiptInput = {
  /**
   * The address of the bid receipt account.
   * This is the account that stores information about this bid.
   * The Bid model is built on top of this account.
   */
  receiptAddress: PublicKey;

  /** A model of the Auction House related to this bid. */
  auctionHouse: AuctionHouse;

  /**
   * Whether or not we should fetch the JSON Metadata for the NFT or SFT.
   *
   * @defaultValue `true`
   */
  loadJsonMetadata?: boolean;

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Handlers
 */
export const findBidByReceiptOperationHandler: OperationHandler<FindBidByReceiptOperation> =
  {
    handle: async (
      operation: FindBidByReceiptOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const { receiptAddress, auctionHouse, commitment } = operation.input;

      const account = toBidReceiptAccount(
        await metaplex.rpc().getAccount(receiptAddress, commitment)
      );
      scope.throwIfCanceled();

      const lazyBid = toLazyBid(account, auctionHouse);
      return metaplex
        .auctionHouse()
        .loadBid({ lazyBid, ...operation.input })
        .run(scope);
    },
  };
