import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { toPurchaseReceiptAccount } from './accounts';
import { AuctionHouse } from './AuctionHouse';
import { DisposableScope } from '@/utils';
import { Purchase, toPurchase } from './Purchase';
import { findPurchaseReceiptPda } from './pdas';

// -----------------
// Operation
// -----------------

const Key = 'FindPurchaseByAddressOperation' as const;
export const findPurchaseByAddressOperation =
  useOperation<FindPurchaseByAddressOperation>(Key);
export type FindPurchaseByAddressOperation = Operation<
  typeof Key,
  FindPurchaseByAddressInput,
  Purchase
>;

export type FindPurchaseByAddressInput = {
  sellerTradeState: PublicKey;
  buyerTradeState: PublicKey;
  auctionHouse: AuctionHouse;
  loadJsonMetadata?: boolean; // Default: true
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

export const findPurchaseByAddressOperationHandler: OperationHandler<FindPurchaseByAddressOperation> =
  {
    handle: async (
      operation: FindPurchaseByAddressOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const {
        sellerTradeState,
        buyerTradeState,
        auctionHouse,
        commitment,
        loadJsonMetadata = true,
      } = operation.input;

      const receiptAddress = findPurchaseReceiptPda(
        sellerTradeState,
        buyerTradeState
      );
      const account = toPurchaseReceiptAccount(
        await metaplex.rpc().getAccount(receiptAddress, commitment)
      );

      const tokenModel = await metaplex
        .nfts()
        .findTokenWithMetadataByMetadata(
          account.data.metadata,
          account.data.buyer,
          { commitment, loadJsonMetadata }
        )
        .run(scope);

      return toPurchase(account, auctionHouse, tokenModel);
    },
  };
