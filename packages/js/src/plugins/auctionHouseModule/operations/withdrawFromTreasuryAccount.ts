import { ConfirmOptions } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import {
  createWithdrawFromTreasuryInstruction,
  WithdrawFromTreasuryInstructionAccounts,
} from '@metaplex-foundation/mpl-auction-house';
import {
  useOperation,
  Operation,
  OperationHandler,
  Signer,
  SolAmount,
  SplTokenAmount,
} from '@/types';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { AuctionHouse } from '../models';
import { findAuctionHouseTreasuryPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'WithdrawFromTreasuryAccountOperation' as const;

/**
 * Transfers funds from Auction House Treasury Wallet to the Treasury Withdrawal Destination Wallet set on an Auction House creation.
 * By default Treasury Withdrawal Destination Wallet is set to `metaplex.identity()`.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .withdrawFromTreasuryAccount({ auctionHouse, amount })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const withdrawFromTreasuryAccountOperation =
  useOperation<WithdrawFromTreasuryAccountOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type WithdrawFromTreasuryAccountOperation = Operation<
  typeof Key,
  WithdrawFromTreasuryAccountInput,
  WithdrawFromTreasuryAccountOutput
>;

/**
 * @group Operations
 * @category Inputs
 */

export type WithdrawFromTreasuryAccountInput = {
  /**
   * The Auction House from which to transfer funds from the treasury wallet to the treasury withdrawal destination wallet.
   * `treasuryWithdrawalDestinationAddress` is set on Auction House creation, but you can also change it via the `update` operation.
   */
  auctionHouse: Pick<
    AuctionHouse,
    | 'treasuryMint'
    | 'authorityAddress'
    | 'treasuryWithdrawalDestinationAddress'
    | 'address'
  >;

  /**
   * The Auction House authority.
   *
   * @defaultValue `metaplex.identity()`
   */
  authority?: Signer;

  /**
   * The Signer paying for the transaction fee.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /**
   * Amount of funds to withdraw.
   * This can either be in SOL or in the SPL token used by the Auction House as a currency.
   */
  amount: SolAmount | SplTokenAmount;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type WithdrawFromTreasuryAccountOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const withdrawFromTreasuryAccountOperationHandler: OperationHandler<WithdrawFromTreasuryAccountOperation> =
  {
    handle: async (
      operation: WithdrawFromTreasuryAccountOperation,
      metaplex: Metaplex
    ) =>
      withdrawFromTreasuryAccountBuilder(
        metaplex,
        operation.input
      ).sendAndConfirm(metaplex, operation.input.confirmOptions),
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type WithdrawFromTreasuryAccountBuilderParams = Omit<
  WithdrawFromTreasuryAccountInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type WithdrawFromTreasuryAccountBuilderContext = Omit<
  WithdrawFromTreasuryAccountOutput,
  'response'
>;

/**
 * Transfers funds from Auction House Treasury Wallet to the Treasury Withdrawal Destination Wallet set on an Auction House creation.
 * By default Treasury Withdrawal Destination Wallet is set to `metaplex.identity()`.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .withdrawFromTreasuryAccount({ auctionHouse, amount });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const withdrawFromTreasuryAccountBuilder = (
  metaplex: Metaplex,
  params: WithdrawFromTreasuryAccountBuilderParams
): TransactionBuilder<WithdrawFromTreasuryAccountBuilderContext> => {
  // Data.
  const {
    auctionHouse,
    amount,
    instructionKey,
    payer = metaplex.identity(),
    authority = metaplex.identity(),
  } = params;

  // Accounts.
  const auctionHouseTreasury = findAuctionHouseTreasuryPda(
    auctionHouse.address
  );

  const accounts: WithdrawFromTreasuryInstructionAccounts = {
    treasuryMint: auctionHouse.treasuryMint.address,
    authority: auctionHouse.authorityAddress,
    treasuryWithdrawalDestination:
      auctionHouse.treasuryWithdrawalDestinationAddress,
    auctionHouseTreasury: auctionHouseTreasury,
    auctionHouse: auctionHouse.address,
  };

  // Args.
  const args = {
    amount: amount.basisPoints,
  };

  // Withdraw From Treasury Instruction.
  const withdrawFromTreasuryInstruction = createWithdrawFromTreasuryInstruction(
    accounts,
    args
  );

  // Signers.
  return (
    TransactionBuilder.make()
      .setFeePayer(payer)
      // Withdraw From Treasury.
      .add({
        instruction: withdrawFromTreasuryInstruction,
        signers: [authority],
        key: instructionKey ?? 'withdrawFromTreasuryAccount',
      })
  );
};
