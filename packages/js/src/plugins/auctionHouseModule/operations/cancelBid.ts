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
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { AuctionHouse, Bid } from '../models';
import { AuctioneerAuthorityRequiredError } from '../errors';
import { findAssociatedTokenAccountPda } from '../../tokenModule';
import { findAuctioneerPda } from '../pdas';
import { NftWithToken, SftWithToken } from '@/plugins/nftModule';

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
  // bid: Bid;

    bid: Pick<
  Bid,
  | 'asset'
  | 'buyerAddress'
  | 'isPublic'
  | 'price'
  | 'receiptAddress'
  | 'tokens'
  | 'tradeStateAddress'
>

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type CancelBidOutput = {
  /** The blockchain response from sending and confirming the transaction. */
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

  // Accounts.
  const tokenAccount = bid.isPublic
    ? findAssociatedTokenAccountPda(
        bid.asset.mint.address,
        toPublicKey(bid.buyerAddress)
      )
    : (bid.asset as SftWithToken | NftWithToken).token.address;

  const accounts: CancelInstructionAccounts = {
    wallet: bid.buyerAddress,
    tokenAccount,
    tokenMint: bid.asset.address,
    authority: auctionHouse.authorityAddress,
    auctionHouse: auctionHouse.address,
    auctionHouseFeeAccount: auctionHouse.feeAccountAddress,
    tradeState: bid.tradeStateAddress,
  };

  // Args.
  const args = {
    buyerPrice: bid.price.basisPoints,
    tokenSize: bid.tokens.basisPoints,
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
