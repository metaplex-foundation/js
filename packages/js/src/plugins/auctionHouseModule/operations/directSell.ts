import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import {
  now,
  Operation,
  OperationHandler,
  Signer,
  toPublicKey,
  useOperation,
} from '@/types';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { AuctionHouse, Listing, PrivateBid, Purchase } from '../models';
import {
  createListingBuilder,
  CreateListingBuilderContext,
} from './createListing';
import { executeSaleBuilder, ExecuteSaleBuilderContext } from './executeSale';
import { AuctioneerAuthorityRequiredError } from '../errors';
import { findAssociatedTokenAccountPda } from '../../tokenModule';

// -----------------
// Operation
// -----------------

const Key = 'DirectSellOperation' as const;

/**
 * Creates a listing on a given asset and then executes a sell on the created bid and listing.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .sell({ auctionHouse, bid })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const directSellOperation = useOperation<DirectSellOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type DirectSellOperation = Operation<
  typeof Key,
  DirectSellInput,
  DirectSellOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type DirectSellInput = {
  /** The Auction House in which to create a Listing and execute a Sale. */
  auctionHouse: AuctionHouse;

  /**
   * The Auction House authority.
   * If this is Signer the transaction fee
   * will be paid from the Auction House Fee Account
   *
   * @defaultValue `auctionHouse.authority`
   */
  authority?: PublicKey | Signer;

  /**
   * Creator of a listing.
   *
   * There must be one and only one signer; Authority or Seller must sign.
   *
   * @defaultValue `metaplex.identity()`
   */
  seller?: PublicKey | Signer;

  /**
   * The Bid that is used in the sale.
   * We only need a subset of the `Bid` model but we
   * need enough information regarding its settings to know how
   * to execute the sale.
   *
   * This includes, its asset, auction house address, buyer, receipt address etc.
   */
  bid: Omit<
    PrivateBid,
    'bookkeeperAddress' | 'purchaseReceiptAddress' | 'createdAt'
  >;

  /**
   * The Auctioneer authority key.
   * It is required when Auction House has Auctioneer enabled.
   *
   * @defaultValue No default value.
   */
  auctioneerAuthority?: Signer;

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
  printReceipt?: boolean;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type DirectSellOutput = {
  /** A model that keeps information about the Listing. */
  listing: Listing;

  /** A model that keeps information about the Purchase. */
  purchase: Purchase;

  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const directSellOperationHandler: OperationHandler<DirectSellOperation> =
  {
    handle: async (operation: DirectSellOperation, metaplex: Metaplex) =>
      await (
        await directSellBuilder(metaplex, operation.input)
      ).sendAndConfirm(metaplex, operation.input.confirmOptions),
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type DirectSellBuilderParams = Omit<
  DirectSellInput,
  'confirmOptions'
> & {
  createListingInstructionKey?: string;
  executeSaleInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type DirectSellBuilderContext = Omit<DirectSellOutput, 'response'>;

/**
 * Creates a listing on a given asset and executes a sale on the created listing and given bid.
 *
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .sell({ auctionHouse, bid, seller })
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const directSellBuilder = async (
  metaplex: Metaplex,
  params: DirectSellBuilderParams
): Promise<TransactionBuilder<DirectSellBuilderContext>> => {
  // Data.
  const {
    auctionHouse,
    auctioneerAuthority,
    bid,
    seller = metaplex.identity(),
    authority = auctionHouse.authorityAddress,
    bookkeeper = metaplex.identity(),
    createListingInstructionKey,
    executeSaleInstructionKey,
  } = params;
  const { hasAuctioneer } = auctionHouse;
  const { tokens, price, buyerAddress, asset } = bid;

  const printReceipt =
    (params.printReceipt ?? true) && Boolean(bid.receiptAddress);

  if (hasAuctioneer && !auctioneerAuthority) {
    throw new AuctioneerAuthorityRequiredError();
  }

  const listingBuilder: TransactionBuilder<CreateListingBuilderContext> =
    await createListingBuilder(metaplex, {
      mintAccount: asset.mint.address,
      price: price,
      auctionHouse,
      auctioneerAuthority,
      seller,
      authority,
      tokenAccount: asset.token.address,
      tokens,
      printReceipt,
      bookkeeper,
      instructionKey: createListingInstructionKey,
    });
  const { receipt, sellerTradeState } = listingBuilder.getContext();

  const listing: Listing = {
    model: 'listing',
    lazy: false,
    auctionHouse,
    asset,
    tradeStateAddress: sellerTradeState,
    bookkeeperAddress: toPublicKey(bookkeeper),
    sellerAddress: toPublicKey(seller),
    receiptAddress: receipt,
    purchaseReceiptAddress: null,
    price,
    tokens: tokens,
    createdAt: now(),
    canceledAt: null,
  };

  const saleBuilder: TransactionBuilder<ExecuteSaleBuilderContext> =
    await executeSaleBuilder(metaplex, {
      auctionHouse,
      auctioneerAuthority,
      bid,
      listing,
      printReceipt,
      bookkeeper,
      instructionKey: executeSaleInstructionKey,
    });
  const { receipt: receiptAddress } = saleBuilder.getContext();

  const buyerTokenAccount = findAssociatedTokenAccountPda(
    asset.address,
    buyerAddress
  );
  const purchasedAsset = {
    ...asset,
    token: {
      ...asset.token,
      address: buyerTokenAccount,
      ownerAddress: buyerAddress,
    },
  };

  const purchase: Purchase = {
    auctionHouse,
    model: 'purchase',
    lazy: false,
    asset: purchasedAsset,
    buyerAddress,
    sellerAddress: toPublicKey(seller),
    bookkeeperAddress: toPublicKey(bookkeeper),
    receiptAddress,
    price: bid.price,
    tokens,
    createdAt: now(),
  };

  return TransactionBuilder.make<DirectSellBuilderContext>()
    .setContext({
      listing,
      purchase,
    })
    .add(listingBuilder)
    .add(saleBuilder);
};
