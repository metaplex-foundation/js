import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import {
  useOperation,
  Operation,
  OperationHandler,
  parseAccount,
} from '@/types';
import { AuctionHouse } from '@metaplex-foundation/mpl-auction-house/dist/src/generated';

// -----------------
// Operation
// -----------------

const Key = 'FindAuctionHouseByAddressOperation' as const;
export const findAuctionHouseByAddressOperation =
  useOperation<FindAuctionHouseByAddressOperation>(Key);
export type FindAuctionHouseByAddressOperation = Operation<
  typeof Key,
  FindAuctionHouseByAddressOperationInput,
  any
>;

export type FindAuctionHouseByAddressOperationInput = {
  address: PublicKey;
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

export const findAuctionHouseByAddressOperationHandler: OperationHandler<FindAuctionHouseByAddressOperation> =
  {
    handle: async (
      operation: FindAuctionHouseByAddressOperation,
      metaplex: Metaplex
    ) => {
      const { address, commitment } = operation.input;

      const unparsedAccount = await metaplex
        .rpc()
        .getAccount(address, commitment);

      const account = parseAccount(unparsedAccount, AuctionHouse);

      return account;
    },
  };
