import { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler, SolAmount } from '@/types';
import { findAuctionHouseBuyerEscrowPda } from '../pdas';
import { AuctionHouse } from '../models';

// -----------------
// Operation
// -----------------

const Key = 'GetBuyerBalanceOperation' as const;

/**
 * Gets buyer's balance in Auction House escrow account.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .getBuyerBalance({ auctionHouse, buyerAddress })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const getBuyerBalanceOperation =
  useOperation<GetBuyerBalanceOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type GetBuyerBalanceOperation = Operation<
  typeof Key,
  GetBuyerBalanceInput,
  GetBuyerBalanceOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type GetBuyerBalanceInput = {
  /** The Auction House in which to get buyer's escrow balance. */
  auctionHouse: Pick<AuctionHouse, 'address'>;
  /** Buyer's address. */
  buyerAddress: PublicKey;

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Outputs
 */
export type GetBuyerBalanceOutput = SolAmount;

/**
 * @group Operations
 * @category Handlers
 */
export const getBuyerBalanceOperationHandler: OperationHandler<GetBuyerBalanceOperation> =
  {
    handle: async (operation: GetBuyerBalanceOperation, metaplex: Metaplex) => {
      const { auctionHouse, buyerAddress, commitment } = operation.input;

      const buyerEscrow = findAuctionHouseBuyerEscrowPda(
        auctionHouse.address,
        buyerAddress
      );

      return metaplex.rpc().getBalance(buyerEscrow, commitment);
    },
  };
