import type { Commitment } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler, amount } from '@/types';
import { LazyListing, Listing } from './Listing';
import { DisposableScope, Task } from '@/utils';
import { assertNftOrSftWithToken } from '../nftModule';
import { AuctionHouseClient } from './AuctionHouseClient';

// -----------------
// Clients
// -----------------

/** @internal */
export function _loadListingClient(
  this: AuctionHouseClient,
  lazyListing: LazyListing,
  options: Omit<LoadListingInput, 'lazyListing'> = {}
): Task<Listing> {
  return this.metaplex
    .operations()
    .getTask(loadListingOperation({ lazyListing, ...options }));
}

// -----------------
// Operation
// -----------------

const Key = 'LoadListingOperation' as const;
export const loadListingOperation = useOperation<LoadListingOperation>(Key);
export type LoadListingOperation = Operation<
  typeof Key,
  LoadListingInput,
  Listing
>;

export type LoadListingInput = {
  lazyListing: LazyListing;
  loadJsonMetadata?: boolean; // Default: true
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

export const loadListingOperationHandler: OperationHandler<LoadListingOperation> =
  {
    handle: async (
      operation: LoadListingOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const {
        lazyListing,
        loadJsonMetadata = true,
        commitment,
      } = operation.input;

      const asset = await metaplex
        .nfts()
        .findByMetadata(lazyListing.metadataAddress, {
          tokenOwner: lazyListing.sellerAddress,
          commitment,
          loadJsonMetadata,
        })
        .run(scope);
      assertNftOrSftWithToken(asset);

      return {
        ...lazyListing,
        model: 'listing',
        lazy: false,
        asset,
        tokens: amount(lazyListing.tokens, asset.mint.currency),
      };
    },
  };
