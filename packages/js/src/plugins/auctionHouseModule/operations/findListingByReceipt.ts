import type { Commitment, PublicKey } from '@solana/web3.js';
import { toListingReceiptAccount } from '../accounts';
import { AuctionHouse, Listing, toLazyListing } from '../models';
import type { Metaplex as MetaplexType } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { DisposableScope } from '@/utils';

// -----------------
// Operation
// -----------------

const Key = 'FindListingByReceiptOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const findListingByReceiptOperation =
  useOperation<FindListingByReceiptOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindListingByReceiptOperation = Operation<
  typeof Key,
  FindListingByReceiptInput,
  Listing
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindListingByReceiptInput = {
  receiptAddress: PublicKey;
  auctionHouse: AuctionHouse;
  loadJsonMetadata?: boolean; // Default: true

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Handlers
 */
export const findListingByReceiptOperationHandler: OperationHandler<FindListingByReceiptOperation> =
  {
    handle: async (
      operation: FindListingByReceiptOperation,
      metaplex: MetaplexType,
      scope: DisposableScope
    ) => {
      const { receiptAddress, auctionHouse, commitment } = operation.input;

      const account = toListingReceiptAccount(
        await metaplex.rpc().getAccount(receiptAddress, commitment)
      );
      scope.throwIfCanceled();

      const lazyListing = toLazyListing(account, auctionHouse);
      return metaplex
        .auctionHouse()
        .loadListing({ lazyListing, ...operation.input })
        .run(scope);
    },
  };
