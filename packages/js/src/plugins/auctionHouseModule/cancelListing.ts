import { ConfirmOptions, SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import {
  CancelInstructionAccounts,
  createCancelListingReceiptInstruction,
  createCancelInstruction,
  createAuctioneerCancelInstruction,
} from '@metaplex-foundation/mpl-auction-house';
import {
  useOperation,
  Operation,
  OperationHandler,
  Signer,
  isSigner,
  Pda,
} from '@/types';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { AuctionHouse } from './AuctionHouse';
import { Listing } from './Listing';
import { AuctioneerAuthorityRequiredError } from './errors';
import { findAuctioneerPda } from './pdas';
import { AUCTIONEER_PRICE } from './constants';

// -----------------
// Operation
// -----------------

const Key = 'CancelListingOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const cancelListingOperation = useOperation<CancelListingOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type CancelListingOperation = Operation<
  typeof Key,
  CancelListingInput,
  CancelListingOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type CancelListingInput = {
  auctionHouse: AuctionHouse;
  auctioneerAuthority?: Signer; // Use Auctioneer ix when provided
  listing: Listing;

  // Options.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type CancelListingOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const cancelListingOperationHandler: OperationHandler<CancelListingOperation> =
  {
    handle: async (operation: CancelListingOperation, metaplex: Metaplex) =>
      cancelListingBuilder(operation.input).sendAndConfirm(
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
export type CancelListingBuilderParams = Omit<
  CancelListingInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CancelListingBuilderContext = Omit<CancelListingOutput, 'response'>;

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const cancelListingBuilder = (
  params: CancelListingBuilderParams
): TransactionBuilder<CancelListingBuilderContext> => {
  const { auctionHouse, auctioneerAuthority, listing } = params;

  if (auctionHouse.hasAuctioneer && !auctioneerAuthority) {
    throw new AuctioneerAuthorityRequiredError();
  }

  // Data.
  const { asset, tradeStateAddress, price, tokens } = listing;
  const buyerPrice = auctionHouse.hasAuctioneer
    ? AUCTIONEER_PRICE
    : price.basisPoints;

  const accounts: CancelInstructionAccounts = {
    wallet: listing.sellerAddress,
    tokenAccount: asset.token.address,
    tokenMint: asset.address,
    authority: auctionHouse.authorityAddress,
    auctionHouse: auctionHouse.address,
    auctionHouseFeeAccount: auctionHouse.feeAccountAddress,
    tradeState: tradeStateAddress,
  };

  // Args.
  const args = {
    buyerPrice,
    tokenSize: tokens.basisPoints,
  };

  // Cancel Listing Instruction.
  let cancelListingInstruction = createCancelInstruction(accounts, args);
  if (auctioneerAuthority) {
    cancelListingInstruction = createAuctioneerCancelInstruction(
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

      // Cancel Listing.
      .add({
        instruction: cancelListingInstruction,
        signers: cancelSigners,
        key: params.instructionKey ?? 'cancelListing',
      })

      // Cancel Listing Receipt.
      .when(Boolean(listing.receiptAddress), (builder) =>
        builder.add({
          instruction: createCancelListingReceiptInstruction({
            receipt: listing.receiptAddress as Pda,
            instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
          }),
          signers: [],
          key: 'cancelListingReceipt',
        })
      )
  );
};
