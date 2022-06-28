import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { toListingReceiptAccount } from './accounts';
import { AuctionHouse } from './AuctionHouse';
import { TokenWithMetadata } from '../nftModule';
import { Listing, makeListingModel } from './Listing';

// -----------------
// Operation
// -----------------

const Key = 'FindListingByAddressOperation' as const;
export const findListingByAddressOperation =
  useOperation<FindListingByAddressOperation>(Key);
export type FindListingByAddressOperation = Operation<
  typeof Key,
  FindListingByAddressOperationInput,
  Listing
>;

export type FindListingByAddressOperationInput = {
  address: PublicKey;
  auctionHouse: AuctionHouse;
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

export const findListingByAddressOperationHandler: OperationHandler<FindListingByAddressOperation> =
  {
    handle: async (
      operation: FindListingByAddressOperation,
      metaplex: Metaplex
    ) => {
      const { address, auctionHouse, commitment } = operation.input;

      const account = toListingReceiptAccount(
        await metaplex.rpc().getAccount(address, commitment)
      );

      return makeListingModel(
        account,
        auctionHouse,
        {} as unknown as TokenWithMetadata // TODO
      );
    },
  };
