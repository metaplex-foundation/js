import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { toListingReceiptAccount } from './accounts';
import { AuctionHouse } from './AuctionHouse';
import { Listing, toLazyListing } from './Listing';
import { DisposableScope } from '@/utils';
import { findListingReceiptPda } from './pdas';

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
      const {
        tradeStateAddress,
        auctionHouse,
        commitment,
        loadJsonMetadata = true,
      } = operation.input;

      const receiptAddress = findListingReceiptPda(tradeStateAddress);
      const account = toListingReceiptAccount(
        await metaplex.rpc().getAccount(receiptAddress, commitment)
      );
      scope.throwIfCanceled();

      const lazyListing = toLazyListing(account, auctionHouse);
      return metaplex
        .auctions()
        .for(auctionHouse)
        .loadListing(lazyListing, { loadJsonMetadata, commitment })
        .run(scope);
    },
  };
