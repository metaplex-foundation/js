import {
  ConfirmOptions,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { TransactionBuilder, Option } from '@/utils';
import {
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
} from '@/types';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { findAssociatedTokenAccountPda } from '../tokenModule';
import { AuctionHouse } from './AuctionHouse';
import {
  findAuctionHouseBuyerEscrowPda,
  findAuctionHouseProgramAsSignerPda,
  findAuctionHouseTradeStatePda,
  findPurchaseReceiptPda,
} from './pdas';
import { Bid } from './Bid';
import { Listing } from './Listing';

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
  const { sellerAddress, tokens, price, asset } = params.listing;
  const { buyerAddress } = params.bid;

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
    sellerPaymentReceiptAccount: sellerAddress,
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

  const executeSaleInstruction = createExecuteSaleInstruction(accounts, args);
  executeSaleInstruction.keys = [
    ...executeSaleInstruction.keys,
    // Provide additional keys to pay royalties.
    ...asset.creators.map(({ address }) => ({
      pubkey: address,
      isWritable: false,
      isSigner: false,
    })),
  ];

  // Receipt.
  const shouldPrintReceipt = params.printReceipt ?? true;
  const bookkeeper = shouldPrintReceipt
    ? params.bookkeeper ?? metaplex.identity()
    : null;
  const purchaseReceipt = shouldPrintReceipt
    ? findPurchaseReceiptPda(
        params.listing.tradeStateAddress,
        params.bid.tradeStateAddress
      )
    : null;

  return (
    TransactionBuilder.make<ExecuteSaleBuilderContext>()
      .setContext({
        sellerTradeState: params.listing.tradeStateAddress,
        buyerTradeState: params.bid.tradeStateAddress,
        buyer: buyerAddress,
        seller: sellerAddress,
        metadata: asset.metadataAddress,
        bookkeeper: (bookkeeper as Signer).publicKey,
        receipt: purchaseReceipt,
        price,
        tokens,
      })

      // Execute Sale.
      .add({
        instruction: executeSaleInstruction,
        signers: [],
        key: params.instructionKey ?? 'executeSale',
      })

      // Print the Purchase Receipt.
      .when(params.printReceipt ?? true, (builder) =>
        builder.add({
          instruction: createPrintPurchaseReceiptInstruction(
            {
              purchaseReceipt: purchaseReceipt as Pda,
              listingReceipt: params.listing.receiptAddress as Pda,
              bidReceipt: params.bid.receiptAddress as Pda,
              bookkeeper: params.listing.bookkeeperAddress as PublicKey,
              instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
            },
            { purchaseReceiptBump: (purchaseReceipt as Pda).bump }
          ),
          signers: [bookkeeper as Signer],
          key: 'printListingReceipt',
        })
      )
  );
};
