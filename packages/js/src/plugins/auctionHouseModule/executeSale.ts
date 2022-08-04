import {
  ConfirmOptions,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { TransactionBuilder, Option } from '@/utils';
import {
  createAuctioneerExecuteSaleInstruction,
  createExecuteSaleInstruction,
  createPrintPurchaseReceiptInstruction,
} from '@metaplex-foundation/mpl-auction-house';
import {
  useOperation,
  Operation,
  OperationHandler,
  Pda,
  lamports,
  Signer,
  SolAmount,
  SplTokenAmount,
  amount,
  isSigner,
} from '@/types';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { findAssociatedTokenAccountPda } from '../tokenModule';
import { AuctionHouse } from './AuctionHouse';
import {
  findAuctionHouseBuyerEscrowPda,
  findAuctionHouseProgramAsSignerPda,
  findAuctionHouseTradeStatePda,
  findPurchaseReceiptPda,
  findAuctioneerPda,
} from './pdas';
import { Bid } from './Bid';
import { Listing } from './Listing';
import {
  AuctioneerAuthorityRequiredError,
  AuctionHousesDifferError,
  WrongMintError,
} from './errors';

// -----------------
// Operation
// -----------------

const Key = 'ExecuteSaleOperation' as const;
export const executeSaleOperation = useOperation<ExecuteSaleOperation>(Key);
export type ExecuteSaleOperation = Operation<
  typeof Key,
  ExecuteSaleInput,
  ExecuteSaleOutput
>;

export type ExecuteSaleInput = {
  auctionHouse: AuctionHouse;
  auctioneerAuthority?: Signer; // Use Auctioneer ix when provided
  listing: Listing;
  bid: Bid;
  bookkeeper?: Signer; // Default: identity
  printReceipt?: boolean; // Default: true

  // Options.
  confirmOptions?: ConfirmOptions;
};

export type ExecuteSaleOutput = {
  response: SendAndConfirmTransactionResponse;
  sellerTradeState: PublicKey;
  buyerTradeState: PublicKey;
  buyer: PublicKey;
  seller: PublicKey;
  metadata: PublicKey;
  bookkeeper: Option<PublicKey>;
  receipt: Option<Pda>;
  price: SolAmount | SplTokenAmount;
  tokens: SplTokenAmount;
};

// -----------------
// Handler
// -----------------

export const executeSaleOperationHandler: OperationHandler<ExecuteSaleOperation> =
  {
    handle: async (operation: ExecuteSaleOperation, metaplex: Metaplex) =>
      executeSaleBuilder(metaplex, operation.input).sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      ),
  };

// -----------------
// Builder
// -----------------

export type ExecuteSaleBuilderParams = Omit<
  ExecuteSaleInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export type ExecuteSaleBuilderContext = Omit<ExecuteSaleOutput, 'response'>;

export const executeSaleBuilder = (
  metaplex: Metaplex,
  params: ExecuteSaleBuilderParams
): TransactionBuilder<ExecuteSaleBuilderContext> => {
  // Data.
  const auctionHouse = params.auctionHouse;
  const { sellerAddress, asset } = params.listing;
  const { buyerAddress, tokens } = params.bid;

  if (
    !params.listing.auctionHouse.address.equals(params.bid.auctionHouse.address)
  ) {
    throw new AuctionHousesDifferError();
  }
  if (!params.listing.asset.address.equals(params.bid.asset.address)) {
    throw new WrongMintError();
  }
  if (auctionHouse.hasAuctioneer && !params.auctioneerAuthority) {
    throw new AuctioneerAuthorityRequiredError();
  }

  const price = auctionHouse.isNative
    ? lamports(params.bid.price.basisPoints)
    : amount(params.bid.price.basisPoints, auctionHouse.treasuryMint.currency);
  const sellerPaymentReceiptAccount = auctionHouse.isNative
    ? sellerAddress
    : findAssociatedTokenAccountPda(
        auctionHouse.treasuryMint.address,
        buyerAddress
      );

  // Accounts.
  const buyerTokenAccount = findAssociatedTokenAccountPda(
    asset.address,
    buyerAddress
  );
  const escrowPayment = findAuctionHouseBuyerEscrowPda(
    auctionHouse.address,
    buyerAddress
  );
  const freeTradeState = findAuctionHouseTradeStatePda(
    auctionHouse.address,
    sellerAddress,
    auctionHouse.treasuryMint.address,
    asset.address,
    lamports(0).basisPoints,
    tokens.basisPoints,
    asset.token.address
  );
  const programAsSigner = findAuctionHouseProgramAsSignerPda();

  const accounts = {
    buyer: buyerAddress,
    seller: sellerAddress,
    tokenAccount: asset.token.address,
    tokenMint: asset.address,
    metadata: asset.metadataAddress,
    treasuryMint: auctionHouse.treasuryMint.address,
    escrowPaymentAccount: escrowPayment,
    sellerPaymentReceiptAccount,
    buyerReceiptTokenAccount: buyerTokenAccount,
    authority: auctionHouse.authorityAddress,
    auctionHouse: auctionHouse.address,
    auctionHouseFeeAccount: auctionHouse.feeAccountAddress,
    auctionHouseTreasury: auctionHouse.treasuryAccountAddress,
    buyerTradeState: params.bid.tradeStateAddress,
    sellerTradeState: params.listing.tradeStateAddress,
    freeTradeState,
    programAsSigner,
  };

  // Args.
  const args = {
    freeTradeStateBump: freeTradeState.bump,
    escrowPaymentBump: escrowPayment.bump,
    programAsSignerBump: programAsSigner.bump,
    buyerPrice: price.basisPoints,
    tokenSize: tokens.basisPoints,
  };

  // Execute Sale Instruction
  let executeSaleInstruction = createExecuteSaleInstruction(accounts, args);
  if (params.auctioneerAuthority) {
    executeSaleInstruction = createAuctioneerExecuteSaleInstruction(
      {
        ...accounts,
        auctioneerAuthority: params.auctioneerAuthority.publicKey,
        ahAuctioneerPda: findAuctioneerPda(
          auctionHouse.address,
          params.auctioneerAuthority.publicKey
        ),
      },
      args
    );
  }

  executeSaleInstruction.keys = [
    ...executeSaleInstruction.keys,
    // Provide additional keys to pay royalties.
    ...asset.creators.map(({ address }) => ({
      pubkey: address,
      isWritable: false,
      isSigner: false,
    })),
  ];

  // Signers.
  const executeSaleSigners = [params.auctioneerAuthority].filter(
    (input): input is Signer => !!input && isSigner(input)
  );

  // Receipt.
  const shouldPrintReceipt =
    (params.printReceipt ?? true) &&
    Boolean(params.listing.receiptAddress && params.bid.receiptAddress);
  const bookkeeper = params.bookkeeper ?? metaplex.identity();
  const purchaseReceipt = findPurchaseReceiptPda(
    params.listing.tradeStateAddress,
    params.bid.tradeStateAddress
  );

  return (
    TransactionBuilder.make<ExecuteSaleBuilderContext>()
      .setContext({
        sellerTradeState: params.listing.tradeStateAddress,
        buyerTradeState: params.bid.tradeStateAddress,
        buyer: buyerAddress,
        seller: sellerAddress,
        metadata: asset.metadataAddress,
        bookkeeper: shouldPrintReceipt ? bookkeeper.publicKey : null,
        receipt: shouldPrintReceipt ? purchaseReceipt : null,
        price,
        tokens,
      })

      // Execute Sale.
      .add({
        instruction: executeSaleInstruction,
        signers: executeSaleSigners,
        key: params.instructionKey ?? 'executeSale',
      })

      // Print the Purchase Receipt.
      .when(shouldPrintReceipt, (builder) =>
        builder.add({
          instruction: createPrintPurchaseReceiptInstruction(
            {
              purchaseReceipt: purchaseReceipt,
              listingReceipt: params.listing.receiptAddress as Pda,
              bidReceipt: params.bid.receiptAddress as Pda,
              bookkeeper: bookkeeper.publicKey,
              instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
            },
            { purchaseReceiptBump: purchaseReceipt.bump }
          ),
          signers: [bookkeeper],
          key: 'printListingReceipt',
        })
      )
  );
};
