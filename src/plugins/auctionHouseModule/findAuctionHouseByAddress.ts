import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { parseAuctionHouseAccount } from '@/programs';
import { AuctionHouse } from './AuctionHouse';
import { AccountNotFoundError } from '@/errors';

// -----------------
// Operation
// -----------------

const Key = 'FindAuctionHouseByAddressOperation' as const;
export const findAuctionHouseByAddressOperation =
  useOperation<FindAuctionHouseByAddressOperation>(Key);
export type FindAuctionHouseByAddressOperation = Operation<
  typeof Key,
  FindAuctionHouseByAddressOperationInput,
  AuctionHouse
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

      if (!unparsedAccount.exists) {
        throw new AccountNotFoundError(address, 'AuctionHouse');
      }

      const account = parseAuctionHouseAccount(unparsedAccount);

      return new AuctionHouse(account);
    },
  };
