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
import {
  AuctioneerAuthorityRequiredError,
  WithdrawFromBuyerAccountRequiresSignerError,
} from '../errors';

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
export const withdrawFromBuyerAccountOperation =
  useOperation<WithdrawFromBuyerAccountOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type WithdrawFromBuyerAccountOperation = Operation<
  typeof Key,
  WithdrawFromBuyerAccountInput,
  WithdrawFromBuyerAccountOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type WithdrawFromBuyerAccountInput = {
  /** The Auction House from which escrow buyer withdraws funds. */
  auctionHouse: Pick<
    AuctionHouse,
    | 'address'
    | 'authorityAddress'
    | 'hasAuctioneer'
    | 'treasuryMint'
    | 'feeAccountAddress'
  >;

  /**
   * The buyer who withdraws funds.
   *
   * There must be one and only one signer; Authority or Seller must sign.
   *
   * @defaultValue `metaplex.identity()`
   */
  buyer?: PublicKey | Signer;

  /**
   * The Signer paying for the creation of all accounts
   * required to deposit to the buyer's account.
   * This account will also pay for the transaction fee.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /**
   * The Authority key.
   * It is required when the buyer is not a signer.
   * There must be one and only one signer; Authority or Buyer must sign.
   *
   * @defaultValue Defaults to not being used.
   */
  authority?: Signer;

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
export type WithdrawFromBuyerAccountOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const withdrawFromBuyerAccountOperationHandler: OperationHandler<WithdrawFromBuyerAccountOperation> =
  {
    handle: async (
      operation: WithdrawFromBuyerAccountOperation,
      metaplex: Metaplex
    ) =>
      withdrawFromBuyerAccountBuilder(metaplex, operation.input).sendAndConfirm(
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
export type WithdrawFromBuyerAccountBuilderParams = Omit<
  WithdrawFromBuyerAccountInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type WithdrawFromBuyerAccountBuilderContext = Omit<
  WithdrawFromBuyerAccountOutput,
  'response'
>;

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
  metaplex: Metaplex,
  params: WithdrawFromBuyerAccountBuilderParams
): TransactionBuilder<WithdrawFromBuyerAccountBuilderContext> => {
  const {
    auctionHouse,
    auctioneerAuthority,
    amount,
    payer = metaplex.identity(),
  } = params;

  if (auctionHouse.hasAuctioneer && !params.auctioneerAuthority) {
    throw new AuctioneerAuthorityRequiredError();
  }

  const amountBasisPoint = amount.basisPoints;
  const buyer = params.buyer ?? (metaplex.identity() as Signer);
  const authority = params.authority ?? auctionHouse.authorityAddress;

  if (!isSigner(buyer) && !isSigner(authority)) {
    throw new WithdrawFromBuyerAccountRequiresSignerError();
  }

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
      accountsWithAuctioneer,
      args
    );
  }

  // Signers.
  const signer = isSigner(buyer) ? buyer : (authority as Signer);
  const withdrawSigners = [signer, params.auctioneerAuthority].filter(isSigner);

  // Update the account to be a signer since it's not covered properly by MPL due to its dynamic nature.
  const signerKeyIndex = withdrawInstruction.keys.findIndex((key) =>
    key.pubkey.equals(signer.publicKey)
  );
  withdrawInstruction.keys[signerKeyIndex].isSigner = true;

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)
      // Withdraw.
      .add({
        instruction: withdrawInstruction,
        signers: withdrawSigners,
        key: params.instructionKey ?? 'withdrawFromBuyerAccount',
      })
  );
};
