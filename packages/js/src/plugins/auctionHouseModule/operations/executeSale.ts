import {
  ConfirmOptions,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { TransactionBuilder, Option, DisposableScope } from '@/utils';
import {
  AuctioneerExecuteSaleInstructionAccounts,
  createAuctioneerExecuteSaleInstruction,
  createExecutePartialSaleInstruction,
  createExecuteSaleInstruction,
  createPrintPurchaseReceiptInstruction,
  ExecutePartialSaleInstructionArgs,
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
  isSigner,
  now,
  amount,
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
  AuctioneerPartialSaleNotSupportedError,
  BidAndListingHaveDifferentAuctionHousesError,
  BidAndListingHaveDifferentMintsError,
  CanceledBidIsNotAllowedError,
  CanceledListingIsNotAllowedError,
  PartialPriceMismatchError,
} from '../errors';

// -----------------
// Operation
// -----------------

const Key = 'ExecuteSaleOperation' as const;

/**
 * Executes a sale on a given bid and listing.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .executeSale({ auctionHouse, bid, listing })
 *   .run();
 * ```
 *
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
  /**
   * The Bid that is used in the sale.
   * We only need a subset of the `Bid` model but we
   * need enough information regarding its settings to know how
   * to execute the sale.
   *
   * This includes, its asset, auction house address, buyer, receipt address etc.
   */
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
  >;

  /**
   * The Listing that is used in the sale.
   * We only need a subset of the `Listing` model but we
   * need enough information regarding its settings to know how
   * to execute the sale.
   *
   * This includes, its asset, auction house address, seller, receipt address etc.
   */
  listing: Pick<
    Listing,
    | 'asset'
    | 'auctionHouse'
    | 'canceledAt'
    | 'price'
    | 'receiptAddress'
    | 'sellerAddress'
    | 'tokens'
    | 'tradeStateAddress'
  >;

  /** The Auction House in which to execute a sale. */
  auctionHouse: AuctionHouse;

  /**
   * The Auctioneer authority key.
   * It is required when Auction House has Auctioneer enabled.
   *
   * @defaultValue No default value.
   */
  auctioneerAuthority?: Signer; // Use Auctioneer ix when provided

  /**
   * The address of the bookkeeper wallet responsible for the receipt.
   *
   * @defaultValue `metaplex.identity()`
   */
  bookkeeper?: Signer;

  /**
   * Prints the purchase receipt.
   * The receipt holds information about the purchase,
   * So it's important to print it if you want to use the `Purchase` model
   *
   * @defaultValue `true`
   */
  printReceipt?: boolean; // Default: true

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type ExecuteSaleOutput = {
  /** Seller trade state account address encoding the listing order. */
  sellerTradeState: PublicKey;

  /** Biyer trade state account address encoding the bid order. */
  buyerTradeState: PublicKey;

  /** The buyer address. */
  buyer: PublicKey;

  /** The seller address. */
  seller: PublicKey;

  /** The asset's metadata address. */
  metadata: PublicKey;

  /** The address of the bookkeeper account responsible for the receipt. */
  bookkeeper: Option<PublicKey>;

  /** The PDA of the receipt account in case it was printed. */
  receipt: Option<Pda>;

  /** The sale price. */
  price: SolAmount | SplTokenAmount;

  /** The number of tokens bought. */
  tokens: SplTokenAmount;

  /** A model that keeps information about the Purchase. */
  purchase: Purchase;

  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * Executes a sale on a given bid and listing.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .executeSale({ auctionHouse, listing, bid });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
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
  const { sellerAddress, asset } = listing;
  const { buyerAddress } = bid;
  const {
    hasAuctioneer,
    isNative,
    treasuryMint,
    address: auctionHouseAddress,
    authorityAddress,
    feeAccountAddress,
    treasuryAccountAddress,
  } = auctionHouse;

  const isPartialSale = bid.tokens.basisPoints < listing.tokens.basisPoints;
  // Use full size of listing & price when finding trade state PDA for the partial sale.
  const { tokens, price } = isPartialSale ? listing : bid;
  const { price: buyerPrice, tokens: buyerTokensSize } = bid;

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
  if (hasAuctioneer && !auctioneerAuthority) {
    throw new AuctioneerAuthorityRequiredError();
  }
  if (isPartialSale && hasAuctioneer) {
    throw new AuctioneerPartialSaleNotSupportedError();
  }
  if (isPartialSale) {
    const listingPricePerToken = price.basisPoints.div(tokens.basisPoints);
    const buyerPricePerToken = buyerPrice.basisPoints.div(
      buyerTokensSize.basisPoints
    );

    if (!listingPricePerToken.eq(buyerPricePerToken)) {
      throw new PartialPriceMismatchError(
        auctionHouse.isNative
          ? lamports(listingPricePerToken)
          : amount(listingPricePerToken, auctionHouse.treasuryMint.currency),
        auctionHouse.isNative
          ? lamports(buyerPricePerToken)
          : amount(buyerPricePerToken, auctionHouse.treasuryMint.currency)
      );
    }
  }

  // Accounts.
  const sellerPaymentReceiptAccount = isNative
    ? sellerAddress
    : findAssociatedTokenAccountPda(treasuryMint.address, sellerAddress);
  const buyerReceiptTokenAccount = findAssociatedTokenAccountPda(
    asset.address,
    buyerAddress
  );
  const escrowPayment = findAuctionHouseBuyerEscrowPda(
    auctionHouseAddress,
    buyerAddress
  );
  const freeTradeState = findAuctionHouseTradeStatePda(
    auctionHouseAddress,
    sellerAddress,
    treasuryMint.address,
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
    treasuryMint: treasuryMint.address,
    escrowPaymentAccount: escrowPayment,
    sellerPaymentReceiptAccount,
    buyerReceiptTokenAccount,
    authority: authorityAddress,
    auctionHouse: auctionHouseAddress,
    auctionHouseFeeAccount: feeAccountAddress,
    auctionHouseTreasury: treasuryAccountAddress,
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
    tokenSize: tokens.basisPoints,
  };

  // Execute Sale Instruction
  const partialSaleArgs: ExecutePartialSaleInstructionArgs = {
    ...args,
    partialOrderSize: bid.tokens.basisPoints,
    partialOrderPrice: bid.price.basisPoints,
  };

  let executeSaleInstruction = isPartialSale
    ? createExecutePartialSaleInstruction(accounts, partialSaleArgs)
    : createExecuteSaleInstruction(accounts, args);

  if (auctioneerAuthority) {
    const auctioneerAccounts: AuctioneerExecuteSaleInstructionAccounts = {
      ...accounts,
      auctioneerAuthority: auctioneerAuthority.publicKey,
      ahAuctioneerPda: findAuctioneerPda(
        auctionHouseAddress,
        auctioneerAuthority.publicKey
      ),
    };

    executeSaleInstruction = createAuctioneerExecuteSaleInstruction(
      auctioneerAccounts,
      args
    );
  }

  // Provide additional keys to pay royalties.
  asset.creators.forEach(({ address }) => {
    executeSaleInstruction.keys.push({
      pubkey: address,
      isWritable: true,
      isSigner: false,
    });

    // Provide ATA to receive SPL token royalty if is not native SOL sale.
    if (!isNative) {
      executeSaleInstruction.keys.push({
        pubkey: findAssociatedTokenAccountPda(treasuryMint.address, address),
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
    Boolean(listing.receiptAddress && bid.receiptAddress && !isPartialSale);
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
