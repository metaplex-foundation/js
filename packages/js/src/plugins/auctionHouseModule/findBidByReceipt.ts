import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { AuctionHouse } from './AuctionHouse';
import { DisposableScope } from '@/utils';
import { Bid, toLazyBid } from './Bid';
import { toBidReceiptAccount } from './accounts';

// -----------------
// Operation
// -----------------

const Key = 'FindBidByReceiptOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const findBidByReceiptOperation =
  useOperation<FindBidByReceiptOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindBidByReceiptOperation = Operation<
  typeof Key,
  FindBidByReceiptInput,
  Bid
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindBidByReceiptInput = {
  receiptAddress: PublicKey;
  auctionHouse: AuctionHouse;
  loadJsonMetadata?: boolean; // Default: true
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Handlers
 */
export const findBidByReceiptOperationHandler: OperationHandler<FindBidByReceiptOperation> =
  {
    handle: async (
      operation: FindBidByReceiptOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const {
        receiptAddress,
        auctionHouse,
        commitment,
        loadJsonMetadata = true,
      } = operation.input;

      const account = toBidReceiptAccount(
        await metaplex.rpc().getAccount(receiptAddress, commitment)
      );
      scope.throwIfCanceled();

      const lazyBid = toLazyBid(account, auctionHouse);
      return metaplex
        .auctions()
        .for(auctionHouse)
        .loadBid(lazyBid, { loadJsonMetadata, commitment })
        .run(scope);
    },
  };
