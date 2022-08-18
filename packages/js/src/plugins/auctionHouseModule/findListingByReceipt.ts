import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { toListingReceiptAccount } from './accounts';
import { AuctionHouse } from './AuctionHouse';
import { Listing, toLazyListing } from './Listing';
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
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const {
        receiptAddress,
        auctionHouse,
        commitment,
        loadJsonMetadata = true,
      } = operation.input;

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
