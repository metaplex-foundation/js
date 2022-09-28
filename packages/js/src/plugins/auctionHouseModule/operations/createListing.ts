import {
  ConfirmOptions,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from '@solana/web3.js';
import {
  createAuctioneerSellInstruction,
  createPrintListingReceiptInstruction,
  createSellInstruction,
} from '@metaplex-foundation/mpl-auction-house';
import type { Metaplex } from '@/Metaplex';
import type { SendAndConfirmTransactionResponse } from '../../rpcModule';
import {
  useOperation,
  Operation,
  OperationHandler,
  Signer,
  toPublicKey,
  token,
  lamports,
  isSigner,
  Pda,
  amount,
  SolAmount,
  SplTokenAmount,
  now,
} from '@/types';
import { TransactionBuilder, Option, DisposableScope } from '@/utils';
import {
  findAuctioneerPda,
  findAuctionHouseProgramAsSignerPda,
  findAuctionHouseTradeStatePda,
  findListingReceiptPda,
} from '../pdas';
import { AuctionHouse, LazyListing, Listing } from '../models';
import { findAssociatedTokenAccountPda } from '../../tokenModule';
import { findMetadataPda } from '../../nftModule';
import { AUCTIONEER_PRICE } from '../constants';
import {
  AuctioneerAuthorityRequiredError,
  CreateListingRequiresSignerError,
} from '../errors';

// -----------------
// Operation
// -----------------

const Key = 'CreateListingOperation' as const;

/**
 * Creates a listing on a given asset.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .createListing({ auctionHouse, mintAccount })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const createListingOperation = useOperation<CreateListingOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type CreateListingOperation = Operation<
  typeof Key,
  CreateListingInput,
  CreateListingOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type CreateListingInput = {
  /** A model of the Auction House related to this listing. */
  auctionHouse: AuctionHouse;

  /**
   * The Signer paying for the creation of all accounts
   * required to create a new listing.
   * This account will also pay for the transaction fee.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /**
   * Creator of a listing.
   *
   * The wallet being a signer is the only condition in which an NFT can sell at a price of 0.
   * If the user does list at 0 then auction house can change the sale price if the 'can_change_sale_price' option is true.
   * If the trade is not priced at 0, the wallet holder has to be a signer since auction house cannot sign if listing over 0.
   * There must be one and only one signer; Authority or Seller must sign.
   *
   * @defaultValue `metaplex.identity()`
   */
  seller?: PublicKey | Signer;

  /**
   * The Auction House authority.
   *
   * There must be one and only one signer; Authority or Seller must sign.
   * Auction house should be the signer for changing the price instead of user wallet for cases when seller lists at 0.
   *
   * @defaultValue `auctionHouse.authority`
   */
  authority?: PublicKey | Signer;

  /**
   * The Auctioneer authority key.
   * It is required when Auction House has Auctioneer enabled.
   *
   * @defaultValue No default value.
   */
  auctioneerAuthority?: Signer;

  /**
   * The mint account to create a listing for.
   * This is used to find the metadata.
   */
  mintAccount: PublicKey;

  /**
   * The token account address that's associated to the asset a listing created is for.
   *
   * @defaultValue Seller's Associated Token Account.
   */
  tokenAccount?: PublicKey;

  /**
   * The listing price.
   *
   * @defaultValue 0 SOLs or tokens.
   */
  price?: SolAmount | SplTokenAmount;

  /**
   * The number of tokens to list.
   * For an NFT listing it must be 1 token.
   *
   * When a Fungible Asset is put on sale.
   * The buyer can then create a buy order of said assets that is
   * less than the token_size of the sell order.
   *
   * @defaultValue 1 token.
   */
  tokens?: SplTokenAmount;

  /**
   * The address of the bookkeeper wallet responsible for the receipt.
   *
   * @defaultValue `metaplex.identity()`
   */
  bookkeeper?: Signer;

  /**
   * Prints the listing receipt.
   * The receipt holds information about the listing,
   * So it's important to print it if you want to use the `Listing` model
   *
   * The receipt printing is skipped for the Auctioneer Auction House
   * Since it currently doesn't support it.
   *
   * @defaultValue `true`
   */
  printReceipt?: boolean;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type CreateListingOutput = {
  /** Seller trade state account PDA encoding the listing order. */
  sellerTradeState: Pda;

  /** Seller free trade state account PDA encoding the free listing order. */
  freeSellerTradeState: Pda;

  /** The asset's token account address. */
  tokenAccount: PublicKey;

  /** The asset's metadata PDA. */
  metadata: Pda;

  /** The seller address. */
  seller: PublicKey;

  /** The PDA of the receipt account in case it was printed. */
  receipt: Option<Pda>;

  /** The address of the bookkeeper account responsible for the receipt. */
  bookkeeper: Option<PublicKey>;

  /** The listing price. */
  price: SolAmount | SplTokenAmount;

  /** The number of tokens listed. */
  tokens: SplTokenAmount;

  /** A model that keeps information about the Listing. */
  listing: Listing;

  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const createListingOperationHandler: OperationHandler<CreateListingOperation> =
  {
    async handle(
      operation: CreateListingOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<CreateListingOutput> {
      const { auctionHouse, confirmOptions } = operation.input;

      const output = await createListingBuilder(
        metaplex,
        operation.input
      ).sendAndConfirm(metaplex, confirmOptions);
      scope.throwIfCanceled();

      if (output.receipt) {
        const listing = await metaplex
          .auctionHouse()
          .findListingByReceipt({
            receiptAddress: output.receipt,
            auctionHouse,
          })
          .run(scope);

        return { listing, ...output };
      }

      scope.throwIfCanceled();
      const lazyListing: LazyListing = {
        model: 'listing',
        lazy: true,
        auctionHouse,
        tradeStateAddress: output.sellerTradeState,
        bookkeeperAddress: output.bookkeeper,
        sellerAddress: output.seller,
        metadataAddress: output.metadata,
        receiptAddress: output.receipt,
        purchaseReceiptAddress: null,
        price: output.price,
        tokens: output.tokens.basisPoints,
        createdAt: now(),
        canceledAt: null,
      };

      return {
        listing: await metaplex
          .auctionHouse()
          .loadListing({ lazyListing })
          .run(scope),
        ...output,
      };
    },
  };

// -----------------
// Builder
// -----------------

/**
 * Creates a listing on a given asset.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .createListing({ auctionHouse, mintAccount });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export type CreateListingBuilderParams = Omit<
  CreateListingInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CreateListingBuilderContext = Omit<
  CreateListingOutput,
  'response' | 'listing'
>;

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const createListingBuilder = (
  metaplex: Metaplex,
  params: CreateListingBuilderParams
): TransactionBuilder<CreateListingBuilderContext> => {
  const {
    auctionHouse,
    auctioneerAuthority,
    mintAccount,
    payer = metaplex.identity(),
    tokens = token(1),
    seller = metaplex.identity(),
    authority = auctionHouse.authorityAddress,
  } = params;

  // Data.
  const priceBasisPoint = auctioneerAuthority
    ? AUCTIONEER_PRICE
    : params.price?.basisPoints ?? 0;
  const price = auctionHouse.isNative
    ? lamports(priceBasisPoint)
    : amount(priceBasisPoint, auctionHouse.treasuryMint.currency);

  if (auctionHouse.hasAuctioneer && !auctioneerAuthority) {
    throw new AuctioneerAuthorityRequiredError();
  }
  if (!isSigner(seller) && !isSigner(authority)) {
    throw new CreateListingRequiresSignerError();
  }

  // Accounts.
  const metadata = findMetadataPda(mintAccount);
  const tokenAccount =
    params.tokenAccount ??
    findAssociatedTokenAccountPda(mintAccount, toPublicKey(seller));
  const sellerTradeState = findAuctionHouseTradeStatePda(
    auctionHouse.address,
    toPublicKey(seller),
    auctionHouse.treasuryMint.address,
    mintAccount,
    price.basisPoints,
    tokens.basisPoints,
    tokenAccount
  );
  const freeSellerTradeState = findAuctionHouseTradeStatePda(
    auctionHouse.address,
    toPublicKey(seller),
    auctionHouse.treasuryMint.address,
    mintAccount,
    lamports(0).basisPoints,
    tokens.basisPoints,
    tokenAccount
  );
  const programAsSigner = findAuctionHouseProgramAsSignerPda();
  const accounts = {
    wallet: toPublicKey(seller),
    tokenAccount,
    metadata,
    authority: toPublicKey(authority),
    auctionHouse: auctionHouse.address,
    auctionHouseFeeAccount: auctionHouse.feeAccountAddress,
    sellerTradeState,
    freeSellerTradeState,
    programAsSigner,
  };

  // Args.
  const args = {
    tradeStateBump: sellerTradeState.bump,
    freeTradeStateBump: freeSellerTradeState.bump,
    programAsSignerBump: programAsSigner.bump,
    buyerPrice: price.basisPoints,
    tokenSize: tokens.basisPoints,
  };

  // Sell Instruction.
  let sellInstruction = createSellInstruction(accounts, args);
  if (auctioneerAuthority) {
    sellInstruction = createAuctioneerSellInstruction(
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
  const signer = isSigner(seller) ? seller : (authority as Signer);
  const sellSigners = [signer, auctioneerAuthority].filter(isSigner);

  // Update the account to be a signer since it's not covered properly by MPL due to its dynamic nature.
  const signerKeyIndex = sellInstruction.keys.findIndex((key) =>
    key.pubkey.equals(signer.publicKey)
  );
  sellInstruction.keys[signerKeyIndex].isSigner = true;

  // Receipt.
  // Since createPrintListingReceiptInstruction can't deserialize createAuctioneerSellInstruction due to a bug
  // Don't print Auctioneer Sell receipt for the time being.
  const shouldPrintReceipt =
    (params.printReceipt ?? true) && !auctioneerAuthority;
  const bookkeeper = params.bookkeeper ?? metaplex.identity();
  const receipt = findListingReceiptPda(sellerTradeState);

  return (
    TransactionBuilder.make<CreateListingBuilderContext>()
      .setFeePayer(payer)
      .setContext({
        sellerTradeState,
        freeSellerTradeState,
        tokenAccount,
        metadata,
        seller: toPublicKey(seller),
        receipt: shouldPrintReceipt ? receipt : null,
        bookkeeper: shouldPrintReceipt ? bookkeeper.publicKey : null,
        price,
        tokens,
      })

      // Create Listing.
      .add({
        instruction: sellInstruction,
        signers: sellSigners,
        key: 'sell',
      })

      // Print the Listing Receipt.
      .when(shouldPrintReceipt, (builder) =>
        builder.add({
          instruction: createPrintListingReceiptInstruction(
            {
              receipt,
              bookkeeper: bookkeeper.publicKey,
              instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
            },
            { receiptBump: receipt.bump }
          ),
          signers: [bookkeeper],
          key: 'printListingReceipt',
        })
      )
  );
};
