import type { Commitment } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler, amount } from '@/types';
import { assert, DisposableScope } from '@/utils';
import { Bid, LazyBid } from './Bid';
import { assertNftOrSftWithToken } from '../nftModule';

// -----------------
// Operation
// -----------------

const Key = 'LoadBidOperation' as const;
export const loadBidOperation = useOperation<LoadBidOperation>(Key);
export type LoadBidOperation = Operation<typeof Key, LoadBidInput, Bid>;

export type LoadBidInput = {
  lazyBid: LazyBid;
  loadJsonMetadata?: boolean; // Default: true
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

export const loadBidOperationHandler: OperationHandler<LoadBidOperation> = {
  handle: async (
    operation: LoadBidOperation,
    metaplex: Metaplex,
    scope: DisposableScope
  ) => {
    const { lazyBid, loadJsonMetadata = true, commitment } = operation.input;

    const bid: Omit<Bid, 'asset' | 'tokens'> = {
      ...lazyBid,
      model: 'bid',
      lazy: false,
    };

    if (lazyBid.tokenAddress) {
      const asset = await metaplex
        .nfts()
        .findByToken({
          token: lazyBid.tokenAddress,
          commitment,
          loadJsonMetadata,
        })
        .run(scope);
      scope.throwIfCanceled();

      assertNftOrSftWithToken(asset);
      assert(
        asset.metadataAddress.equals(lazyBid.metadataAddress),
        `Asset metadata address must be ${lazyBid.metadataAddress}`
      );

      return {
        ...bid,
        isPublic: false,
        asset,
        tokens: amount(lazyBid.tokens, asset.mint.currency),
      };
    } else {
      const asset = await metaplex
        .nfts()
        .findByMetadata({
          metadata: lazyBid.metadataAddress,
          commitment,
          loadJsonMetadata,
        })
        .run(scope);
      scope.throwIfCanceled();

      return {
        ...bid,
        isPublic: true,
        asset,
        tokens: amount(lazyBid.tokens, asset.mint.currency),
      };
    }
  },
};
