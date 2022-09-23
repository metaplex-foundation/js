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
import {
  AuctionHouse,
  Bid,
  LazyListing,
  LazyPurchase,
  Listing,
  Purchase,
} from '../models';
import { NftWithToken, SftWithToken } from '../../nftModule/models';
import {
  createListingBuilder,
  CreateListingBuilderContext,
} from './createListing';
import { executeSaleBuilder, ExecuteSaleBuilderContext } from './executeSale';
import { findAssociatedTokenAccountPda } from '../../tokenModule';
import { AuctioneerDirectSellNotSupportedError } from '../errors';

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
    | 'isPublic'
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
    handle: async (operation: DirectSellOperation, metaplex: Metaplex) => {
      const { lazyPurchase, listing, response } = await directSellBuilder(
        metaplex,
        operation.input
      ).then((buyBuilder) =>
        buyBuilder.sendAndConfirm(metaplex, operation.input.confirmOptions)
      );

      const purchase = await metaplex
        .auctionHouse()
        .loadPurchase({ lazyPurchase })
        .run();

      return { listing, purchase, response };
    },
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
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type DirectSellBuilderContext = Omit<
  DirectSellOutput,
  'response' | 'purchase'
> & { lazyPurchase: LazyPurchase };

/**
 * Creates a listing on a given asset and executes a sale on the created listing and given bid.
 *
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .directSellBuilder({ auctionHouse, bid })
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
    bid,
    seller = metaplex.identity(),
    authority = auctionHouse.authorityAddress,
    bookkeeper = metaplex.identity(),
    ...rest
  } = params;
  const { tokens, price, buyerAddress, isPublic, asset } = bid;
  const tokenAccount = isPublic
    ? findAssociatedTokenAccountPda(
        asset.mint.address,
        toPublicKey(buyerAddress)
      )
    : (asset as SftWithToken | NftWithToken).token.address;
  const printReceipt = true;

  if (auctionHouse.hasAuctioneer) {
    throw new AuctioneerDirectSellNotSupportedError();
  }

  const listingBuilder: TransactionBuilder<CreateListingBuilderContext> =
    await createListingBuilder(metaplex, {
      mintAccount: asset.mint.address,
      price: price,
      auctionHouse,
      seller,
      authority,
      tokenAccount,
      tokens,
      printReceipt,
      bookkeeper,
      ...rest,
    });
  const { receipt, metadata, sellerTradeState } = listingBuilder.getContext();

  const lazyListing: LazyListing = {
    model: 'listing',
    lazy: true,
    auctionHouse,
    tradeStateAddress: sellerTradeState,
    bookkeeperAddress: toPublicKey(bookkeeper),
    sellerAddress: toPublicKey(seller),
    metadataAddress: metadata,
    receiptAddress: receipt,
    purchaseReceiptAddress: null,
    price,
    tokens: tokens.basisPoints,
    createdAt: now(),
    canceledAt: null,
  };

  const listing = await metaplex
    .auctionHouse()
    .loadListing({ lazyListing })
    .run();

  const saleBuilder: TransactionBuilder<ExecuteSaleBuilderContext> =
    await executeSaleBuilder(metaplex, {
      auctionHouse,
      bid,
      listing,
      printReceipt,
      bookkeeper,
      ...rest,
    });
  const {
    receipt: saleReceipt,
    metadata: saleMetadata,
    buyer,
  } = saleBuilder.getContext();

  const lazyPurchase: LazyPurchase = {
    auctionHouse,
    model: 'purchase',
    lazy: true,
    buyerAddress: buyer,
    sellerAddress: toPublicKey(seller),
    metadataAddress: saleMetadata,
    bookkeeperAddress: toPublicKey(bookkeeper),
    receiptAddress: saleReceipt,
    price: bid.price,
    tokens: tokens.basisPoints,
    createdAt: now(),
  };

  return TransactionBuilder.make<DirectSellBuilderContext>()
    .setContext({
      listing,
      lazyPurchase,
    })
    .add(listingBuilder)
    .add(saleBuilder);
};
