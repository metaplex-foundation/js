import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { AuctionHouse } from './AuctionHouse';
import { DisposableScope } from '@/utils';
import { findBidReceiptPda } from './pdas';
import { Bid, toLazyBid } from './Bid';
import { toBidReceiptAccount } from './accounts';
import { AuctionHouseClient } from './AuctionHouseClient';

// -----------------
// Clients
// -----------------

export function _findBidByAddressClient(
  this: AuctionHouseClient,
  address: PublicKey,
  options?: Omit<FindBidByAddressInput, 'address' | 'auctionHouse'>
) {
  return this.metaplex.operations().getTask(
    findBidByAddressOperation({
      address,
      auctionHouse: this.auctionHouse,
      ...options,
    })
  );
}

// -----------------
// Operation
// -----------------

const Key = 'FindBidByAddressOperation' as const;
export const findBidByAddressOperation =
  useOperation<FindBidByAddressOperation>(Key);
export type FindBidByAddressOperation = Operation<
  typeof Key,
  FindBidByAddressInput,
  Bid
>;

export type FindBidByAddressInput = {
  address: PublicKey;
  auctionHouse: AuctionHouse;
  loadJsonMetadata?: boolean; // Default: true
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

export const findBidByAddressOperationHandler: OperationHandler<FindBidByAddressOperation> =
  {
    handle: async (
      operation: FindBidByAddressOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const {
        address,
        auctionHouse,
        commitment,
        loadJsonMetadata = true,
      } = operation.input;

      const receiptAddress = findBidReceiptPda(address);
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
