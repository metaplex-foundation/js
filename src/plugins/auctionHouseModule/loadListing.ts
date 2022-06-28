import type { Commitment } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler, amount } from '@/types';
import { LazyListing, Listing } from './Listing';
import { DisposableScope } from '@/utils';

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

      const tokenModel = await metaplex
        .nfts()
        .findTokenWithMetadataByMetadata(
          lazyListing.metadataAddress,
          lazyListing.sellerAddress,
          { commitment, loadJsonMetadata }
        )
        .run(scope);

      return {
        ...lazyListing,
        model: 'listing',
        lazy: false,
        token: tokenModel,
        tokens: amount(lazyListing.tokens, tokenModel.mint.currency),
      };
    },
  };
