import type { Commitment } from '@solana/web3.js';
import { LazyListing, Listing } from '../models/Listing';
import { assertNftOrSftWithToken } from '../../nftModule';
import type { Metaplex as MetaplexType } from '@/Metaplex';
import { useOperation, Operation, OperationHandler, amount } from '@/types';
import { DisposableScope } from '@/utils';

// -----------------
// Operation
// -----------------

const Key = 'LoadListingOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const loadListingOperation = useOperation<LoadListingOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type LoadListingOperation = Operation<
  typeof Key,
  LoadListingInput,
  Listing
>;

/**
 * @group Operations
 * @category Inputs
 */
export type LoadListingInput = {
  lazyListing: LazyListing;
  loadJsonMetadata?: boolean; // Default: true

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Handlers
 */
export const loadListingOperationHandler: OperationHandler<LoadListingOperation> =
  {
    handle: async (
      operation: LoadListingOperation,
      metaplex: MetaplexType,
      scope: DisposableScope
    ) => {
      const {
        lazyListing,
        loadJsonMetadata = true,
        commitment,
      } = operation.input;

      const asset = await metaplex
        .nfts()
        .findByMetadata({
          metadata: lazyListing.metadataAddress,
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
