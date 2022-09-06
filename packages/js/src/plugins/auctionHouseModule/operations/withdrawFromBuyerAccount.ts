import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import {
  WithdrawInstructionAccounts,
  createWithdrawInstruction,
  createAuctioneerWithdrawInstruction,
} from '@metaplex-foundation/mpl-auction-house';
import {
  useOperation,
  Operation,
  OperationHandler,
  Signer,
  isSigner,
  toPublicKey,
  SplTokenAmount,
  SolAmount,
} from '@/types';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { AuctionHouse } from '../models';
import { findAuctioneerPda, findAuctionHouseBuyerEscrowPda } from '../pdas';
import { AuctioneerAuthorityRequiredError } from '../errors';

// -----------------
// Operation
// -----------------

const Key = 'WithdrawFromBuyerAccountOperation' as const;

/**
 * Withdraws funds from the user's buyer escrow account for the given auction house.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .withdraw({ auctionHouse, buyer, amount })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const withdrawFromBuyerAccountOperation = useOperation<WithdrawOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type WithdrawOperation = Operation<
  typeof Key,
  WithdrawInput,
  WithdrawOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type WithdrawInput = {
  /** The Auction House from which escrow buyer withdraws funds. */
  auctionHouse: AuctionHouse;
  /**
   * The buyer who withdraws funds.
   * This expects a Signer.
   *
   * @defaultValue `metaplex.identity()`
   */
  buyer?: PublicKey | Signer;
  /**
   * The Authority key.
   * It is required when the buyer is not a signer.
   *
   * @defaultValue Defaults to not being used.
   */
  authority?: PublicKey | Signer;
  /**
   * The Auctioneer authority key.
   * It is required when Auction House has Auctioneer enabled.
   *
   * @defaultValue No default value.
   */
  auctioneerAuthority?: Signer;
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
export type WithdrawOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const withdrawOperationHandler: OperationHandler<WithdrawOperation> = {
  handle: async (operation: WithdrawOperation, metaplex: Metaplex) =>
    withdrawFromBuyerAccountBuilder(operation.input, metaplex).sendAndConfirm(
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
export type WithdrawBuilderParams = Omit<WithdrawInput, 'confirmOptions'> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type WithdrawBuilderContext = Omit<WithdrawOutput, 'response'>;

/**
 * Withdraws funds from the user's buyer escrow account to the given auction house.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .withdrawFromBuyerAccountBuilder({ auctionHouse, buyer, amount });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const withdrawFromBuyerAccountBuilder = (
  params: WithdrawBuilderParams,
  metaplex: Metaplex
): TransactionBuilder<WithdrawBuilderContext> => {
  const { auctionHouse, auctioneerAuthority, amount } = params;

  if (auctionHouse.hasAuctioneer && !params.auctioneerAuthority) {
    throw new AuctioneerAuthorityRequiredError();
  }

  const amountBasisPoint = amount.basisPoints;
  const buyer = params.buyer ?? (metaplex.identity() as Signer);
  const authority = params.authority ?? auctionHouse.authorityAddress;
  const escrowPayment = findAuctionHouseBuyerEscrowPda(
    auctionHouse.address,
    toPublicKey(buyer)
  );

  // Accounts,
  const accounts: WithdrawInstructionAccounts = {
    wallet: toPublicKey(buyer),
    receiptAccount: toPublicKey(buyer),
    escrowPaymentAccount: escrowPayment,
    treasuryMint: auctionHouse.treasuryMint.address,
    authority: toPublicKey(authority),
    auctionHouse: auctionHouse.address,
    auctionHouseFeeAccount: auctionHouse.feeAccountAddress,
  };

  // Args.
  const args = {
    escrowPaymentBump: escrowPayment.bump,
    amount: amountBasisPoint,
  };

  // Withdraw Instruction.
  let withdrawInstruction = createWithdrawInstruction(accounts, args);
  if (auctioneerAuthority) {
    const ahAuctioneerPda = findAuctioneerPda(
      auctionHouse.address,
      auctioneerAuthority.publicKey
    );

    const accountsWithAuctioneer = {
      ...accounts,
      auctioneerAuthority: auctioneerAuthority.publicKey,
      ahAuctioneerPda,
    };

    withdrawInstruction = createAuctioneerWithdrawInstruction(
      { ...accountsWithAuctioneer },
      args
    );
  }

  // Signers.
  const withdrawSigners = [buyer, authority, params.auctioneerAuthority].filter(
    isSigner
  );

  return (
    TransactionBuilder.make()

      // Withdraw.
      .add({
        instruction: withdrawInstruction,
        signers: withdrawSigners,
        key: params.instructionKey ?? 'withdrawFromBuyerAccount',
      })
  );
};
