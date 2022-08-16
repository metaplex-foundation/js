import { ConfirmOptions, SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import {
  CancelInstructionAccounts,
  createCancelBidReceiptInstruction,
  createCancelInstruction,
  createAuctioneerCancelInstruction,
} from '@metaplex-foundation/mpl-auction-house';
import {
  useOperation,
  Operation,
  OperationHandler,
  Signer,
  isSigner,
  toPublicKey,
  Pda,
} from '@/types';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { AuctionHouse } from './AuctionHouse';
import { Bid } from './Bid';
import { AuctioneerAuthorityRequiredError } from './errors';
import { findAssociatedTokenAccountPda } from '../tokenModule';
import { findAuctioneerPda } from './pdas';

// -----------------
// Operation
// -----------------

const Key = 'CancelBidOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const cancelBidOperation = useOperation<CancelBidOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type CancelBidOperation = Operation<
  typeof Key,
  CancelBidInput,
  CancelBidOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type CancelBidInput = {
  auctionHouse: AuctionHouse;
  auctioneerAuthority?: Signer; // Use Auctioneer ix when provided
  bid: Bid;

  // Options.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type CancelBidOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const cancelBidOperationHandler: OperationHandler<CancelBidOperation> = {
  handle: async (operation: CancelBidOperation, metaplex: Metaplex) =>
    cancelBidBuilder(operation.input).sendAndConfirm(
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
export type CancelBidBuilderParams = Omit<CancelBidInput, 'confirmOptions'> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CancelBidBuilderContext = Omit<CancelBidOutput, 'response'>;

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const cancelBidBuilder = (
  params: CancelBidBuilderParams
): TransactionBuilder<CancelBidBuilderContext> => {
  const { auctionHouse, auctioneerAuthority, bid } = params;

  if (auctionHouse.hasAuctioneer && !auctioneerAuthority) {
    throw new AuctioneerAuthorityRequiredError();
  }

  // Data.
  const { asset, tradeStateAddress, price, tokens, isPublic } = bid;

  // Accounts.
  const tokenAccount = isPublic
    ? findAssociatedTokenAccountPda(
        asset.mint.address,
        toPublicKey(bid.buyerAddress)
      )
    : bid.asset.token.address;

  const accounts: CancelInstructionAccounts = {
    wallet: bid.buyerAddress,
    tokenAccount,
    tokenMint: asset.address,
    authority: auctionHouse.authorityAddress,
    auctionHouse: auctionHouse.address,
    auctionHouseFeeAccount: auctionHouse.feeAccountAddress,
    tradeState: tradeStateAddress,
  };

  // Args.
  const args = {
    buyerPrice: price.basisPoints,
    tokenSize: tokens.basisPoints,
  };

  // Cancel Bid Instruction.
  let cancelBidInstruction = createCancelInstruction(accounts, args);
  if (auctioneerAuthority) {
    cancelBidInstruction = createAuctioneerCancelInstruction(
      {
        ...accounts,
        auctioneerAuthority: auctioneerAuthority.publicKey,
        ahAuctioneerPda: findAuctioneerPda(
          auctionHouse.address,
          auctioneerAuthority.publicKey
        ),
      },
      args
    );
  }

  // Signers.
  const cancelSigners = [auctioneerAuthority].filter(isSigner);

  return (
    TransactionBuilder.make()

      // Cancel Bid.
      .add({
        instruction: cancelBidInstruction,
        signers: cancelSigners,
        key: params.instructionKey ?? 'cancelBid',
      })

      // Cancel Bid Receipt.
      .when(Boolean(bid.receiptAddress), (builder) =>
        builder.add({
          instruction: createCancelBidReceiptInstruction({
            receipt: bid.receiptAddress as Pda,
            instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
          }),
          signers: [],
          key: 'cancelBidReceipt',
        })
      )
  );
};
