import type { Commitment } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler, amount } from '@/types';
import { DisposableScope } from '@/utils';
import { Bid, LazyBid } from './Bid';

// -----------------
// Operation
// -----------------

const Key = 'LoadBidOperation' as const;
export const loadBidOperation = useOperation<LoadBidOperation>(Key);
export type LoadBidOperation = Operation<
  typeof Key,
  LoadBidInput,
  Bid
>;

export type LoadBidInput = {
  lazyBid: LazyBid;
  loadJsonMetadata?: boolean; // Default: true
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

export const loadBidOperationHandler: OperationHandler<LoadBidOperation> =
  {
    handle: async (
      operation: LoadBidOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const {
        lazyBid,
        loadJsonMetadata = true,
        commitment,
      } = operation.input;

      const tokenModel = await metaplex
        .nfts()
        .findTokenWithMetadataByMetadata(
          lazyBid.metadataAddress,
          lazyBid.buyerAddress,
          { commitment, loadJsonMetadata }
        )
        .run(scope);

      return {
        ...lazyBid,
        model: 'bid',
        lazy: false,
        token: tokenModel,
        tokens: amount(lazyBid.tokens, tokenModel.mint.currency),
      };
    },
  };
