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
export const findListingByAddressOperation =
  useOperation<FindListingByAddressOperation>(Key);
export type FindListingByAddressOperation = Operation<
  typeof Key,
  FindListingByAddressInput,
  Listing
>;

export type FindListingByAddressInput = {
  address: PublicKey;
  auctionHouse: AuctionHouse;
  loadJsonMetadata?: boolean; // Default: true
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

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
      .loadListing(lazyListing, { loadJsonMetadata, commitment })
      .run(scope);
  },
};
