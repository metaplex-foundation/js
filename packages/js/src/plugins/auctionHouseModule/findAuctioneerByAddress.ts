import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { toAuctioneerAccount } from './accounts';
import { Auctioneer, toAuctioneer } from './Auctioneer';

// -----------------
// Operation
// -----------------

const Key = 'FindAuctioneerByAddressOperation' as const;
export const findAuctioneerByAddressOperation =
  useOperation<FindAuctioneerByAddressOperation>(Key);
export type FindAuctioneerByAddressOperation = Operation<
  typeof Key,
  FindAuctioneerByAddressInput,
  Auctioneer
>;

export type FindAuctioneerByAddressInput = {
  address: PublicKey;
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

export const findAuctioneerByAddressOperationHandler: OperationHandler<FindAuctioneerByAddressOperation> =
  {
    handle: async (
      operation: FindAuctioneerByAddressOperation,
      metaplex: Metaplex
    ) => {
      const { address, commitment } = operation.input;

      const account = toAuctioneerAccount(
        await metaplex.rpc().getAccount(address, commitment)
      );

      return toAuctioneer(account);
    },
  };
