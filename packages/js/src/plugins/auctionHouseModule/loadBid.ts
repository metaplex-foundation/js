import type { Commitment } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler, amount } from '@/types';
import { assert, DisposableScope } from '@/utils';
import { Bid, LazyBid } from './Bid';
import { assertTokenWithMetadata } from '../nftModule';

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

    const bid: Omit<Bid, 'token' | 'mint' | 'tokens'> = {
      ...lazyBid,
      model: 'bid',
      lazy: false,
    };

    if (lazyBid.tokenAddress) {
      const tokenModel = await metaplex
        .nfts()
        .findTokenWithMetadataByAddress(lazyBid.tokenAddress, {
          commitment,
          loadJsonMetadata,
        })
        .run(scope);
      scope.throwIfCanceled();

      assertTokenWithMetadata(tokenModel);
      assert(
        tokenModel.metadata.address.equals(lazyBid.metadataAddress),
        `Token Modal metadata address must be ${lazyBid.metadataAddress}`
      );

      return {
        ...bid,
        isPublic: false,
        token: tokenModel,
        tokens: amount(lazyBid.tokens, tokenModel.mint.currency),
      };
    } else {
      const mintModel = await metaplex
        .nfts()
        .findMintWithMetadataByMetadata(lazyBid.metadataAddress, {
          commitment,
          loadJsonMetadata,
        })
        .run(scope);
      scope.throwIfCanceled();

      return {
        ...bid,
        isPublic: true,
        mint: mintModel,
        tokens: amount(lazyBid.tokens, mintModel.currency),
      };
    }
  },
};
