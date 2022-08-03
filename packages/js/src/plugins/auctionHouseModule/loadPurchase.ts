import type { Commitment } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler, amount } from '@/types';
import { DisposableScope } from '@/utils';
import { Purchase, LazyPurchase } from './Purchase';
import { assertNftOrSftWithToken } from '../nftModule';

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

      const purchase: Omit<Purchase, 'asset' | 'tokens'> = {
        ...lazyPurchase,
        model: 'purchase',
        lazy: false,
      };

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
        ...purchase,
        isPublic: false,
        asset,
        tokens: amount(lazyPurchase.tokens, asset.mint.currency),
      };
    },
  };
