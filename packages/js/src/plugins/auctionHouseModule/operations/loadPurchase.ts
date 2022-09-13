import type { Commitment } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler, amount } from '@/types';
import { DisposableScope } from '@/utils';
import { Purchase, LazyPurchase } from '../models/Purchase';
import { assertNftOrSftWithToken } from '../../nftModule';

// -----------------
// Operation
// -----------------

const Key = 'LoadPurchaseOperation' as const;

/**
 * Transforms a `LazyPurchase` model into a `Purchase` model.
 *
 * ```ts
 * const purchase = await metaplex
 *   .auctionHouse()
 *   .loadPurchase({ lazyPurchase })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const loadPurchaseOperation = useOperation<LoadPurchaseOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type LoadPurchaseOperation = Operation<
  typeof Key,
  LoadPurchaseInput,
  Purchase
>;

/**
 * @group Operations
 * @category Inputs
 */
export type LoadPurchaseInput = {
  /** The `LazyPurchase` model to transform into the `Purchase`.  */
  lazyPurchase: LazyPurchase;

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
export const loadPurchaseOperationHandler: OperationHandler<LoadPurchaseOperation> =
  {
    handle: async (
      operation: LoadPurchaseOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const {
        lazyPurchase,
        loadJsonMetadata = true,
        commitment,
      } = operation.input;

      const asset = await metaplex
        .nfts()
        .findByMetadata({
          metadata: lazyPurchase.metadataAddress,
          tokenOwner: lazyPurchase.buyerAddress,
          commitment,
          loadJsonMetadata,
        })
        .run(scope);
      assertNftOrSftWithToken(asset);

      return {
        ...lazyPurchase,
        lazy: false,
        isPublic: false,
        asset,
        tokens: amount(lazyPurchase.tokens, asset.mint.currency),
      };
    },
  };
