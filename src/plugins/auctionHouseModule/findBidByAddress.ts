import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { AuctionHouse } from './AuctionHouse';
import { DisposableScope } from '@/utils';
import { findBidReceiptPda } from './pdas';
import { Bid, toBid } from './Bid';
import { toBidReceiptAccount } from './accounts';

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

      if (account.data.tokenAccount) {
        const tokenModel = await metaplex
          .nfts()
          .findTokenWithMetadataByMetadata(
            account.data.metadata,
            account.data.buyer,
            { commitment, loadJsonMetadata }
          )
          .run(scope);

        return toBid(account, auctionHouse, tokenModel);
      }

      const mintModel = await metaplex
        .nfts()
        .findMintWithMetadataByMetadata(account.data.metadata, {
          commitment,
          loadJsonMetadata,
        })
        .run(scope);

      return toBid(account, auctionHouse, mintModel);
    },
  };
