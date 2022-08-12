import type { Commitment } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler, amount } from '@/types';
import { DisposableScope, Task } from '@/utils';
import { Purchase, LazyPurchase } from './Purchase';
import { assertNftOrSftWithToken } from '../nftModule';
import { AuctionHouseClient } from './AuctionHouseClient';

// -----------------
// Clients
// -----------------

export function _loadPurchaseClient(
  this: AuctionHouseClient,
  lazyPurchase: LazyPurchase,
  options: Omit<LoadPurchaseInput, 'lazyPurchase'> = {}
): Task<Purchase> {
  return this.metaplex
    .operations()
    .getTask(loadPurchaseOperation({ lazyPurchase, ...options }));
}

// -----------------
// Operation
// -----------------

const Key = 'LoadPurchaseOperation' as const;
export const loadPurchaseOperation = useOperation<LoadPurchaseOperation>(Key);
export type LoadPurchaseOperation = Operation<
  typeof Key,
  LoadPurchaseInput,
  Purchase
>;

export type LoadPurchaseInput = {
  lazyPurchase: LazyPurchase;
  loadJsonMetadata?: boolean; // Default: true
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

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
        .findByMetadata(lazyPurchase.metadataAddress, {
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
