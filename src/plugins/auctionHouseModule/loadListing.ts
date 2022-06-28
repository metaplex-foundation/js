import type { Commitment } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { AuctionHouse } from './AuctionHouse';
import { LazyListing, Listing } from './Listing';

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
  auctionHouse: AuctionHouse;
  lazyListing: LazyListing;
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

export const loadListingOperationHandler: OperationHandler<LoadListingOperation> =
  {
    handle: async (operation: LoadListingOperation, metaplex: Metaplex) => {
      // const { auctionHouse, lazyListing, commitment } = operation.input;

      // const [] = await metaplex.rpc().getMultipleAccounts([], commitment);

      return {} as Listing;
    },
  };
