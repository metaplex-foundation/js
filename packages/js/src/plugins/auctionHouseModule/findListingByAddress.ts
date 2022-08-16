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

const Key = 'FindListingByAddressOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const findListingByAddressOperation =
  useOperation<FindListingByAddressOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindListingByAddressOperation = Operation<
  typeof Key,
  FindListingByAddressInput,
  Listing
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindListingByAddressInput = {
  address: PublicKey;
  auctionHouse: AuctionHouse;
  loadJsonMetadata?: boolean; // Default: true
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Handlers
 */
export const findListingByAddressOperationHandler: OperationHandler<FindListingByAddressOperation> =
  {
    handle: async (
      operation: FindListingByAddressOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const {
        address,
        auctionHouse,
        commitment,
        loadJsonMetadata = true,
      } = operation.input;

      const receiptAddress = findListingReceiptPda(address);
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
