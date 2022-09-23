import { ConfirmOptions } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import {
  createAuctioneerDepositInstruction,
  createDepositInstruction,
  DepositInstructionAccounts,
} from '@metaplex-foundation/mpl-auction-house';
import {
  useOperation,
  Operation,
  OperationHandler,
  Signer,
  toPublicKey,
  isSigner,
  SolAmount,
  SplTokenAmount,
} from '@/types';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findAssociatedTokenAccountPda } from '../../tokenModule';
import { AuctionHouse } from '../models';
import { findAuctioneerPda, findAuctionHouseBuyerEscrowPda } from '../pdas';
import { AuctioneerAuthorityRequiredError } from '../errors';

// -----------------
// Operation
// -----------------

const Key = 'DepositToBuyerAccountOperation' as const;

/**
 * Adds funds to the user's buyer escrow account for the given auction house.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .depositToBuyerAccount({ auctionHouse, buyer, amount })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const depositToBuyerAccountOperation =
  useOperation<DepositToBuyerAccountOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type DepositToBuyerAccountOperation = Operation<
  typeof Key,
  DepositToBuyerAccountInput,
  DepositToBuyerAccountOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type DepositToBuyerAccountInput = {
  /**
   * The Auction House in which escrow buyer deposits funds.
   * We only need a subset of the `AuctionHouse` model but we
   * need enough information regarding its settings to know how
   * to deposit funds.
   *
   * This includes, its address, authority address, treasury mint, etc.
   */
  auctionHouse: Pick<
    AuctionHouse,
    | 'address'
    | 'authorityAddress'
    | 'hasAuctioneer'
    | 'isNative'
    | 'treasuryMint'
    | 'feeAccountAddress'
  >;

  /**
   * The buyer who deposits funds.
   * This expects a Signer.
   *
   * @defaultValue `metaplex.identity()`
   */
  buyer?: Signer;

  /**
   * The Auctioneer authority key.
   * It is required when Auction House has Auctioneer enabled.
   *
   * @defaultValue Defaults to not being used.
   */
  auctioneerAuthority?: Signer;

  /**
   * The Signer paying for the creation of all accounts
   * required to deposit to the buyer's account.
   * This account will also pay for the transaction fee.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /**
   * Amount of funds to deposit.
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
export type DepositToBuyerAccountOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const depositToBuyerAccountOperationHandler: OperationHandler<DepositToBuyerAccountOperation> =
  {
    handle: async (
      operation: DepositToBuyerAccountOperation,
      metaplex: Metaplex
    ) =>
      depositToBuyerAccountBuilder(metaplex, operation.input).sendAndConfirm(
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
export type DepositToBuyerAccountBuilderParams = Omit<
  DepositToBuyerAccountInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type DepositToBuyerAccountBuilderContext = Omit<
  DepositToBuyerAccountOutput,
  'response'
>;

/**
 * Adds funds to the user's buyer escrow account for the given auction house.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .depositToBuyerAccount({ auctionHouse, buyer, amount });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const depositToBuyerAccountBuilder = (
  metaplex: Metaplex,
  params: DepositToBuyerAccountBuilderParams
): TransactionBuilder<DepositToBuyerAccountBuilderContext> => {
  // Data.
  const {
    auctionHouse,
    auctioneerAuthority,
    amount,
    instructionKey,
    buyer = metaplex.identity(),
    payer = metaplex.identity(),
  } = params;

  if (auctionHouse.hasAuctioneer && !auctioneerAuthority) {
    throw new AuctioneerAuthorityRequiredError();
  }

  // Accounts.
  const paymentAccount = auctionHouse.isNative
    ? toPublicKey(buyer)
    : findAssociatedTokenAccountPda(
        auctionHouse.treasuryMint.address,
        toPublicKey(buyer)
      );
  const escrowPayment = findAuctionHouseBuyerEscrowPda(
    auctionHouse.address,
    toPublicKey(buyer)
  );

  const accounts: DepositInstructionAccounts = {
    wallet: toPublicKey(buyer),
    paymentAccount,
    transferAuthority: toPublicKey(buyer),
    escrowPaymentAccount: escrowPayment,
    treasuryMint: auctionHouse.treasuryMint.address,
    authority: auctionHouse.authorityAddress,
    auctionHouse: auctionHouse.address,
    auctionHouseFeeAccount: auctionHouse.feeAccountAddress,
  };

  // Args.
  const args = {
    escrowPaymentBump: escrowPayment.bump,
    amount: amount.basisPoints,
  };

  // Deposit Instruction.
  let depositInstruction = createDepositInstruction(accounts, args);
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

    depositInstruction = createAuctioneerDepositInstruction(
      { ...accountsWithAuctioneer },
      args
    );
  }

  // Signers.
  const depositSigners = [buyer, auctioneerAuthority].filter(isSigner);

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)
      // Deposit.
      .add({
        instruction: depositInstruction,
        signers: depositSigners,
        key: instructionKey ?? 'depositToBuyerAccount',
      })
  );
};
