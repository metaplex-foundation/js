import { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler, SolAmount } from '@/types';
import { findAuctionHouseBuyerEscrowPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'GetBuyerBalanceOperation' as const;

/**
 * Gets the balance of a buyer's escrow account for a given Auction House.
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
  /** The Auction House in which to get the buyer's escrow balance. */
  auctionHouse: PublicKey;

  /** The buyer's address. */
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
        auctionHouse,
        buyerAddress
      );

      return metaplex.rpc().getBalance(buyerEscrow, commitment);
    },
  };
