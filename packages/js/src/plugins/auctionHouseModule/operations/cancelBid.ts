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
 * Cancels the user's bid in the given auction house.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .cancelBid({ auctionHouse, bid })
 *   .run();
 * ```
 *
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
  /**
   * The Auction House in which to cancel Bid.
   * We only need a subset of the `AuctionHouse` model but we
   * need enough information regarding its settings to know how
   * to cancel bid.
   *
   * This includes, its address, authority address, its fee account address, etc.
   */
  auctionHouse: Pick<
    AuctionHouse,
    'authorityAddress' | 'address' | 'feeAccountAddress' | 'hasAuctioneer'
  >;

  /**
   * The Bid to cancel.
   * We only need a subset of the `Bid` model but we
   * need enough information regarding its settings to know how
   * to cancel it.
   *
   * This includes, its asset, buyer address, price, receipt address etc.
   */
  bid: Pick<
    Bid,
    | 'asset'
    | 'buyerAddress'
    | 'isPublic'
    | 'price'
    | 'receiptAddress'
    | 'tokens'
    | 'tradeStateAddress'
  >;

  /**
   * The Auctioneer authority key.
   * It is required when Auction House has Auctioneer enabled.
   *
   * @defaultValue No default value.
   */
  auctioneerAuthority?: Signer;

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
 * Cancels the user's bid in the given auction house.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .cancelBid({ auctionHouse, bid });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const cancelBidBuilder = (
  params: CancelBidBuilderParams
): TransactionBuilder<CancelBidBuilderContext> => {
  const { auctionHouse, auctioneerAuthority, bid } = params;

  // Data.
  const {
    asset,
    buyerAddress,
    tradeStateAddress,
    price,
    receiptAddress,
    tokens,
    isPublic,
  } = bid;
  const {
    authorityAddress,
    address: auctionHouseAddress,
    feeAccountAddress,
    hasAuctioneer,
  } = auctionHouse;

  if (hasAuctioneer && !auctioneerAuthority) {
    throw new AuctioneerAuthorityRequiredError();
  }

  // Accounts.
  const tokenAccount = isPublic
    ? findAssociatedTokenAccountPda(
        asset.mint.address,
        toPublicKey(buyerAddress)
      )
    : (asset as SftWithToken | NftWithToken).token.address;

  const accounts: CancelInstructionAccounts = {
    wallet: buyerAddress,
    tokenAccount,
    tokenMint: asset.address,
    authority: authorityAddress,
    auctionHouse: auctionHouseAddress,
    auctionHouseFeeAccount: feeAccountAddress,
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
          auctionHouseAddress,
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
      .when(Boolean(receiptAddress), (builder) =>
        builder.add({
          instruction: createCancelBidReceiptInstruction({
            receipt: receiptAddress as Pda,
            instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
          }),
          signers: [],
          key: 'cancelBidReceipt',
        })
      )
  );
};
