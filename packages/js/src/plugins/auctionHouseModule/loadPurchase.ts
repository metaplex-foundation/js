import type { Commitment } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler, amount } from '@/types';
import { DisposableScope } from '@/utils';
import { Purchase, LazyPurchase } from './Purchase';

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

      const purchase: Omit<Purchase, 'token' | 'tokens'> = {
        ...lazyPurchase,
        model: 'purchase',
        lazy: false,
      };

      const tokenModel = await metaplex
        .nfts()
        .findTokenWithMetadataByMetadata(
          lazyPurchase.metadataAddress,
          lazyPurchase.buyerAddress,
          {
            commitment,
            loadJsonMetadata,
          }
        )
        .run(scope);
      scope.throwIfCanceled();

      return {
        ...purchase,
        isPublic: false,
        token: tokenModel,
        tokens: amount(lazyPurchase.tokens, tokenModel.mint.currency),
      };
    },
  };
