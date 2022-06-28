import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { toListingReceiptAccount } from './accounts';
import { AuctionHouse } from './AuctionHouse';
import { Listing, makeListingModel } from './Listing';
import { DisposableScope } from '@/utils';

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
  loadJsonMetadata?: boolean; // Default: true
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

export const findListingByAddressOperationHandler: OperationHandler<FindListingByAddressOperation> =
  {
    handle: async (
      operation: FindListingByAddressOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const {
        address,
        auctionHouse,
        commitment,
        loadJsonMetadata = true,
      } = operation.input;

      const account = toListingReceiptAccount(
        await metaplex.rpc().getAccount(address, commitment)
      );

      const tokenModel = await metaplex
        .nfts()
        .findTokenWithMetadataByMetadata(
          account.data.metadata,
          account.data.seller,
          { commitment, loadJsonMetadata }
        )
        .run(scope);

      return makeListingModel(account, auctionHouse, tokenModel);
    },
  };
