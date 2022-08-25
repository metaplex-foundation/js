import {
  ConfirmOptions,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { TransactionBuilder, Option, DisposableScope } from '@/utils';
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
  now,
} from '@/types';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findAssociatedTokenAccountPda } from '../../tokenModule';
import { AuctionHouse, Bid, Listing, LazyPurchase, Purchase } from '../models';
import {
  findAuctionHouseBuyerEscrowPda,
  findAuctionHouseProgramAsSignerPda,
  findAuctionHouseTradeStatePda,
  findPurchaseReceiptPda,
  findAuctioneerPda,
} from '../pdas';
import {
  AuctioneerAuthorityRequiredError,
  BidAndListingHaveDifferentAuctionHousesError,
  BidAndListingHaveDifferentMintsError,
  CanceledBidIsNotAllowedError,
  CanceledListingIsNotAllowedError,
} from '../errors';

// -----------------
// Operation
// -----------------

const Key = 'ExecuteSaleOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const executeSaleOperation = useOperation<ExecuteSaleOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type ExecuteSaleOperation = Operation<
  typeof Key,
  ExecuteSaleInput,
  ExecuteSaleOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type ExecuteSaleInput = {

bid: Pick<
  Bid,
  | 'asset'
  | 'auctionHouse'
  | 'buyerAddress'
  | 'canceledAt'
  | 'price'
  | 'receiptAddress'
  | 'tokens'
  | 'tradeStateAddress'
>

listing: Pick<
  Listing,
  | 'asset'
  | 'auctionHouse'
  | 'canceledAt'
  | 'sellerAddress'
  | 'tradeStateAddress'
  | 'receiptAddress'
>

  auctionHouse: AuctionHouse;
  auctioneerAuthority?: Signer; // Use Auctioneer ix when provided
  bookkeeper?: Signer; // Default: identity
  printReceipt?: boolean; // Default: true

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type ExecuteSaleOutput = {
  /** The blockchain response from sending and confirming the transaction. */
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
  purchase: Purchase;
};

/**
 * @group Operations
 * @category Handlers
 */
export const executeSaleOperationHandler: OperationHandler<ExecuteSaleOperation> =
  {
    async handle(
      operation: ExecuteSaleOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<ExecuteSaleOutput> {
      const { auctionHouse } = operation.input;

      const output = await executeSaleBuilder(
        metaplex,
        operation.input
      ).sendAndConfirm(metaplex, operation.input.confirmOptions);
      scope.throwIfCanceled();

      if (output.receipt) {
        const purchase = await metaplex
          .auctionHouse()
          .findPurchaseByReceipt({
            auctionHouse,
            receiptAddress: output.receipt,
          })
          .run(scope);

        return { purchase, ...output };
      }

      const lazyPurchase: LazyPurchase = {
        model: 'purchase',
        lazy: true,
        auctionHouse: operation.input.auctionHouse,
        buyerAddress: output.buyer,
        sellerAddress: output.seller,
        metadataAddress: output.metadata,
        bookkeeperAddress: output.bookkeeper,
        receiptAddress: output.receipt,
        price: output.price,
        tokens: output.tokens.basisPoints,
        createdAt: now(),
      };

      return {
        purchase: await metaplex
          .auctionHouse()
          .loadPurchase({ lazyPurchase })
          .run(scope),
        ...output,
      };
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type ExecuteSaleBuilderParams = Omit<
  ExecuteSaleInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type ExecuteSaleBuilderContext = Omit<
  ExecuteSaleOutput,
  'response' | 'purchase'
>;

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const executeSaleBuilder = (
  metaplex: Metaplex,
  params: ExecuteSaleBuilderParams
): TransactionBuilder<ExecuteSaleBuilderContext> => {
  const { auctionHouse, listing, bid, auctioneerAuthority } = params;

  if (!listing.auctionHouse.address.equals(bid.auctionHouse.address)) {
    throw new BidAndListingHaveDifferentAuctionHousesError();
  }
  if (!listing.asset.address.equals(bid.asset.address)) {
    throw new BidAndListingHaveDifferentMintsError();
  }
  if (bid.canceledAt) {
    throw new CanceledBidIsNotAllowedError();
  }
  if (listing.canceledAt) {
    throw new CanceledListingIsNotAllowedError();
  }
  if (auctionHouse.hasAuctioneer && !auctioneerAuthority) {
    throw new AuctioneerAuthorityRequiredError();
  }

  // Data.
  const price = auctionHouse.isNative
    ? lamports(bid.price.basisPoints)
    : amount(bid.price.basisPoints, auctionHouse.treasuryMint.currency);

  // Accounts.
  const sellerPaymentReceiptAccount = auctionHouse.isNative
    ? listing.sellerAddress
    : findAssociatedTokenAccountPda(
        auctionHouse.treasuryMint.address,
        listing.sellerAddress
      );
  const buyerReceiptTokenAccount = findAssociatedTokenAccountPda(
    listing.asset.address,
    bid.buyerAddress
  );
  const escrowPayment = findAuctionHouseBuyerEscrowPda(
    auctionHouse.address,
    bid.buyerAddress
  );
  const freeTradeState = findAuctionHouseTradeStatePda(
    auctionHouse.address,
    listing.sellerAddress,
    auctionHouse.treasuryMint.address,
    listing.asset.address,
    lamports(0).basisPoints,
    bid.tokens.basisPoints,
    listing.asset.token.address
  );
  const programAsSigner = findAuctionHouseProgramAsSignerPda();

  const accounts = {
    buyer: bid.buyerAddress,
    seller: listing.sellerAddress,
    tokenAccount: listing.asset.token.address,
    tokenMint: listing.asset.address,
    metadata: listing.asset.metadataAddress,
    treasuryMint: auctionHouse.treasuryMint.address,
    escrowPaymentAccount: escrowPayment,
    sellerPaymentReceiptAccount,
    buyerReceiptTokenAccount,
    authority: auctionHouse.authorityAddress,
    auctionHouse: auctionHouse.address,
    auctionHouseFeeAccount: auctionHouse.feeAccountAddress,
    auctionHouseTreasury: auctionHouse.treasuryAccountAddress,
    buyerTradeState: bid.tradeStateAddress,
    sellerTradeState: listing.tradeStateAddress,
    freeTradeState,
    programAsSigner,
  };

  // Args.
  const args = {
    freeTradeStateBump: freeTradeState.bump,
    escrowPaymentBump: escrowPayment.bump,
    programAsSignerBump: programAsSigner.bump,
    buyerPrice: price.basisPoints,
    tokenSize: bid.tokens.basisPoints,
  };

  // Execute Sale Instruction
  let executeSaleInstruction = createExecuteSaleInstruction(accounts, args);
  if (auctioneerAuthority) {
    executeSaleInstruction = createAuctioneerExecuteSaleInstruction(
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

  // Provide additional keys to pay royalties.
  listing.asset.creators.forEach(({ address }) => {
    executeSaleInstruction.keys.push({
      pubkey: address,
      isWritable: true,
      isSigner: false,
    });

    // Provide ATA to receive SPL token royalty if is not native SOL sale.
    if (!auctionHouse.isNative) {
      executeSaleInstruction.keys.push({
        pubkey: findAssociatedTokenAccountPda(
          auctionHouse.treasuryMint.address,
          address
        ),
        isWritable: true,
        isSigner: false,
      });
    }
  });

  // Signers.
  const executeSaleSigners = [auctioneerAuthority].filter(isSigner);

  // Receipt.
  const shouldPrintReceipt =
    (params.printReceipt ?? true) &&
    Boolean(listing.receiptAddress && bid.receiptAddress);
  const bookkeeper = params.bookkeeper ?? metaplex.identity();
  const purchaseReceipt = findPurchaseReceiptPda(
    listing.tradeStateAddress,
    bid.tradeStateAddress
  );

  return (
    TransactionBuilder.make<ExecuteSaleBuilderContext>()
      .setContext({
        sellerTradeState: listing.tradeStateAddress,
        buyerTradeState: bid.tradeStateAddress,
        buyer: bid.buyerAddress,
        seller: listing.sellerAddress,
        metadata: listing.asset.metadataAddress,
        bookkeeper: shouldPrintReceipt ? bookkeeper.publicKey : null,
        receipt: shouldPrintReceipt ? purchaseReceipt : null,
        price,
        tokens: bid.tokens
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
              listingReceipt: listing.receiptAddress as Pda,
              bidReceipt: bid.receiptAddress as Pda,
              bookkeeper: bookkeeper.publicKey,
              instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
            },
            { purchaseReceiptBump: purchaseReceipt.bump }
          ),
          signers: [bookkeeper],
          key: 'printPurchaseReceipt',
        })
      )
  );
};
