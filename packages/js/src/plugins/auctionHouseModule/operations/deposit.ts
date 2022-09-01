import { ConfirmOptions, PublicKey } from '@solana/web3.js';
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
  lamports,
  isSigner,
  amount,
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

const Key = 'DepositOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const depositOperation = useOperation<DepositOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type DepositOperation = Operation<
  typeof Key,
  DepositInput,
  DepositOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type DepositInput = {
  auctionHouse: AuctionHouse;
  buyer?: PublicKey | Signer; // Default: identity
  authority?: PublicKey | Signer; // Default: auctionHouse.authority
  auctioneerAuthority?: Signer; // Use Auctioneer ix when provided
  amount: SolAmount | SplTokenAmount;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type DepositOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const depositOperationHandler: OperationHandler<DepositOperation> = {
  handle: async (operation: DepositOperation, metaplex: Metaplex) =>
    depositBuilder(metaplex, operation.input).sendAndConfirm(
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
export type DepositBuilderParams = Omit<DepositInput, 'confirmOptions'> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type DepositBuilderContext = Omit<DepositOutput, 'response'>;

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const depositBuilder = (
  metaplex: Metaplex,
  params: DepositBuilderParams
): TransactionBuilder<DepositBuilderContext> => {
  // Data.
  const auctionHouse = params.auctionHouse;
  const amountBasisPoint = params.amount.basisPoints;
  const depositAmount = auctionHouse.isNative
    ? lamports(amountBasisPoint)
    : amount(amountBasisPoint, auctionHouse.treasuryMint.currency);

  if (auctionHouse.hasAuctioneer && !params.auctioneerAuthority) {
    throw new AuctioneerAuthorityRequiredError();
  }

  // Accounts.
  const buyer = params.buyer ?? (metaplex.identity() as Signer);
  const authority = params.authority ?? auctionHouse.authorityAddress;
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
    authority: toPublicKey(authority),
    auctionHouse: auctionHouse.address,
    auctionHouseFeeAccount: auctionHouse.feeAccountAddress,
  };

  // Args.
  const args = {
    escrowPaymentBump: escrowPayment.bump,
    amount: depositAmount.basisPoints,
  };

  // Deposit Instruction.
  let depositInstruction = createDepositInstruction(accounts, args);
  if (params.auctioneerAuthority) {
    const ahAuctioneerPda = findAuctioneerPda(
      auctionHouse.address,
      params.auctioneerAuthority.publicKey
    );

    const accountsWithAuctioneer = {
      ...accounts,
      auctioneerAuthority: params.auctioneerAuthority.publicKey,
      ahAuctioneerPda,
    };

    depositInstruction = createAuctioneerDepositInstruction(
      { ...accountsWithAuctioneer },
      args
    );
  }

  // Signers.
  const depositSigners = [buyer, params.auctioneerAuthority].filter(
    (input): input is Signer => !!input && isSigner(input)
  );

  return (
    TransactionBuilder.make()

      // Deposit.
      .add({
        instruction: depositInstruction,
        signers: depositSigners,
        key: params.instructionKey ?? 'deposit',
      })
  );
};
