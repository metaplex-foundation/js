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
 * @group Operations
 * @category Constructors
 */
export const withdrawOperation = useOperation<WithdrawOperation>(Key);

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
  auctionHouse: AuctionHouse;
  buyer?: PublicKey | Signer; // Default: identity
  authority?: PublicKey | Signer; // Default: auctionHouse.authority
  auctioneerAuthority?: Signer; // Use Auctioneer ix when provided
  withdrawAmount: SolAmount | SplTokenAmount;

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
    withdrawBuilder(operation.input, metaplex).sendAndConfirm(
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
 * @group Transaction Builders
 * @category Constructors
 */
export const withdrawBuilder = (
  params: WithdrawBuilderParams,
  metaplex: Metaplex
): TransactionBuilder<WithdrawBuilderContext> => {
  const { auctionHouse, auctioneerAuthority, withdrawAmount } = params;

  if (auctionHouse.hasAuctioneer && !params.auctioneerAuthority) {
    throw new AuctioneerAuthorityRequiredError();
  }

  // Data.

  const amountBasisPoint = withdrawAmount.basisPoints;
  const buyer = params.buyer ?? (metaplex.identity() as Signer);
  const authority = params.authority ?? auctionHouse.authorityAddress;
  const escrowPayment = findAuctionHouseBuyerEscrowPda(
    auctionHouse.address,
    toPublicKey(buyer)
  );

  //Accounts
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
  const withdrawSigners = [buyer, params.auctioneerAuthority].filter(
    (input): input is Signer => !!input && isSigner(input)
  );

  return (
    TransactionBuilder.make()

      // Withdraw.
      .add({
        instruction: withdrawInstruction,
        signers: withdrawSigners,
        key: params.instructionKey ?? 'withdraw',
      })
  );
};
