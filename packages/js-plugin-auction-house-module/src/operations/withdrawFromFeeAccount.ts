import { ConfirmOptions } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import {
  createWithdrawFromFeeInstruction,
  WithdrawFromFeeInstructionAccounts,
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

// -----------------
// Operation
// -----------------

const Key = 'WithdrawFromFeeAccountOperation' as const;

/**
 * Transfers funds from Auction House Fee Wallet to the Fee Withdrawal Destination Wallet.
 * By default Fee Withdrawal Destination Wallet is set to `metaplex.identity()`.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .withdrawFromFeeAccount({ auctionHouse, amount })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const withdrawFromFeeAccountOperation =
  useOperation<WithdrawFromFeeAccountOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type WithdrawFromFeeAccountOperation = Operation<
  typeof Key,
  WithdrawFromFeeAccountInput,
  WithdrawFromFeeAccountOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type WithdrawFromFeeAccountInput = {
  /**
   * The Auction House from which to transfer funds from the fee wallet to the fee withdrawal destination wallet.
   * `feeWithdrawalDestinationAddress` is set on Auction House creation, but you can also change it via the `update` operation.
   * */
  auctionHouse: Pick<
    AuctionHouse,
    | 'address'
    | 'authorityAddress'
    | 'feeWithdrawalDestinationAddress'
    | 'feeAccountAddress'
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
export type WithdrawFromFeeAccountOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const withdrawFromFeeAccountOperationHandler: OperationHandler<WithdrawFromFeeAccountOperation> =
  {
    handle: async (
      operation: WithdrawFromFeeAccountOperation,
      metaplex: Metaplex
    ) =>
      withdrawFromFeeAccountBuilder(metaplex, operation.input).sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      ),
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type WithdrawFromFeeAccountBuilderParams = Omit<
  WithdrawFromFeeAccountInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type WithdrawFromFeeAccountBuilderContext = Omit<
  WithdrawFromFeeAccountOutput,
  'response'
>;

/**
 * Transfers funds from Auction House Fee Wallet to the Fee Withdrawal Destination Wallet.
 * By default Fee Withdrawal Destination Wallet is set to `metaplex.identity()`.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .withdrawFromFeeAccount({ auctionHouse, amount });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const withdrawFromFeeAccountBuilder = (
  metaplex: Metaplex,
  params: WithdrawFromFeeAccountBuilderParams
): TransactionBuilder<WithdrawFromFeeAccountBuilderContext> => {
  // Data.
  const {
    auctionHouse,
    amount,
    instructionKey,
    payer = metaplex.identity(),
    authority = metaplex.identity(),
  } = params;

  // Accounts.
  const accounts: WithdrawFromFeeInstructionAccounts = {
    authority: auctionHouse.authorityAddress,
    feeWithdrawalDestination: auctionHouse.feeWithdrawalDestinationAddress,
    auctionHouse: auctionHouse.address,
    auctionHouseFeeAccount: auctionHouse.feeAccountAddress,
  };

  // Args.
  const args = {
    amount: amount.basisPoints,
  };

  // Withdraw From Fee Instruction.
  const withdrawFromFeeInstruction = createWithdrawFromFeeInstruction(
    accounts,
    args
  );

  // Signers.
  return (
    TransactionBuilder.make()
      .setFeePayer(payer)
      // Withdraw From Fee.
      .add({
        instruction: withdrawFromFeeInstruction,
        signers: [authority],
        key: instructionKey ?? 'withdrawFromFeeAccount',
      })
  );
};
