import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { Option, TransactionBuilder } from '@/utils';
import { now, Operation, OperationHandler, Signer, SolAmount, SplTokenAmount, useOperation } from '@/types';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { AuctionHouse, Bid, LazyBid, Listing, Purchase } from '../models';
import { createBidBuilder, CreateBidBuilderContext, executeSaleBuilder, ExecuteSaleBuilderContext } from '@/plugins';

// -----------------
// Operation
// -----------------

const Key = 'DirectBuyOperation' as const;

/**
 * Creates a bid on a given asset and then executes a sale on the created bid and listing.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .buy({ auctionHouse, listing, buyer })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const directBuyOperation = useOperation<DirectBuyOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type DirectBuyOperation = Operation<typeof Key, DirectBuyInput, DirectBuyOutput>;

/**
 * @group Operations
 * @category Inputs
 */
export type DirectBuyInput = {
  /** The Auction House in which to create a Bid and execute a Sale. */
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
   * Creator of a bid.
   *
   * @defaultValue `metaplex.identity()`
   */
  buyer?: Signer;

  /**
   * The Listing that is used in the sale.
   * We only need a subset of the `Listing` model but we
   * need enough information regarding its settings to know how
   * to execute the sale.
   *
   * This includes, its asset, auction house address, seller, receipt address etc.
   */
  listing: Pick<Listing,
    | 'asset'
    | 'auctionHouse'
    | 'canceledAt'
    | 'price'
    | 'sellerAddress'
    | 'tokens'
    | 'tradeStateAddress'
    | 'receiptAddress'>;

  /**
   * The Auctioneer authority key.
   * It is required when Auction House has Auctioneer enabled.
   *
   * @defaultValue No default value.
   */
  auctioneerAuthority?: Signer;

  /**
   * The token account address that's associated to the asset a bid created is for.
   * If this or seller isn't provided in the Listing, then the bid will be public.
   *
   * @defaultValue No default value.
   */
  tokenAccount?: Option<PublicKey>;

  /**
   * The buyer's price.
   *
   * @defaultValue 0 SOLs or tokens.
   */
  price?: SolAmount | SplTokenAmount;

  /**
   * The number of tokens to bid for.
   * For an NFT bid it must be 1 token.
   *
   * When a Fungible Asset is put on sale.
   * The buyer can then create a buy order of said assets that is
   * less than the token_size of the sell order.
   *
   * @defaultValue 1 token.
   */
  tokens?: SplTokenAmount;

  /**
   * Prints the bid and purchase receipts.
   * The receipt holds information about the bid and about the purchase,
   * So it's important to print it if you want to use the `Bid` or `Purchase` model
   *
   * The receipt printing is skipped for the Auctioneer Auction House
   * Since it currently doesn't support it.
   *
   * @defaultValue `true`
   */
  printReceipt?: boolean;

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
export type DirectBuyOutput = {

  bid: Bid;

  /** A model that keeps information about the Purchase. */
  purchase: Purchase;

  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const directBuyOperationHandler: OperationHandler<DirectBuyOperation> = {
  handle: async (operation: DirectBuyOperation, metaplex: Metaplex) => {
    return (await directBuyBuilder(metaplex, operation.input))
      .sendAndConfirm(metaplex, operation.input.confirmOptions);
  },
};

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type DirectBuyBuilderParams = Omit<DirectBuyInput, 'confirmOptions'> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type DirectBuyBuilderContext = Omit<DirectBuyOutput, 'response'>;

/**
 * Creates a bid on a given asset and executes a sale on the created bid and given listing.
 *
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .directBuyBuilder({ auctionHouse, listing })
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const directBuyBuilder = async (
  metaplex: Metaplex,
  params: DirectBuyBuilderParams,
): Promise<TransactionBuilder<DirectBuyBuilderContext>> => {
  // Data.
  const { auctionHouse, listing, price, buyer, tokenAccount, tokens, authority, confirmOptions, ...rest } = params;

  const bidBuilder = await createBidBuilder(metaplex, {
    auctionHouse,
    authority,
    tokens: tokens || listing.tokens,
    price: price || listing.price,
    mintAccount: listing.asset.mint.address,
    seller: listing.sellerAddress,
    ...rest,
  });

  const lazyBid = await extractBidInfo(metaplex, auctionHouse, bidBuilder);

  const saleBuilder: TransactionBuilder<ExecuteSaleBuilderContext> = await executeSaleBuilder(
    metaplex,
    {
      auctionHouse,
      bid: {
        model: 'bid',
        lazy: true,
        auctionHouse,
        asset: listing.asset,
        buyerAddress: lazyBid.buyerAddress,
        canceledAt: lazyBid.canceledAt,
        price: lazyBid.price,
        receiptAddress: lazyBid.receiptAddress,
        tokens: lazyBid.tokens,
        tradeStateAddress: lazyBid.tradeStateAddress,
      } as Bid,
      listing,
      ...rest,
    },
  );

  return TransactionBuilder.make<DirectBuyBuilderContext>()
    .setContext({
      bid: lazyBid as Bid,
      purchase: {
        model: 'purchase',
        lazy: true,
        auctionHouse,
        buyerAddress: saleBuilder.getContext().buyer,
        sellerAddress: saleBuilder.getContext().seller,
        metadataAddress: saleBuilder.getContext().metadata,
        bookkeeperAddress: saleBuilder.getContext().bookkeeper,
        receiptAddress: saleBuilder.getContext().receipt,
        price: saleBuilder.getContext().price,
        tokens: saleBuilder.getContext().tokens.basisPoints,
        createdAt: now(),
      } as Purchase,
    })
    .add(bidBuilder)
    .add(saleBuilder);

};

const extractBidInfo = async (metaplex: Metaplex, auctionHouse: AuctionHouse, builder: TransactionBuilder<CreateBidBuilderContext>): Promise<LazyBid> => {
  const context = builder.getContext();

  return {
    model: 'bid',
    lazy: true,
    auctionHouse,
    tradeStateAddress: context.buyerTradeState,
    bookkeeperAddress: context.bookkeeper,
    tokenAddress: context.tokenAccount,
    buyerAddress: context.buyer,
    metadataAddress: context.metadata,
    receiptAddress: context.receipt,
    purchaseReceiptAddress: null,
    isPublic: Boolean(context.tokenAccount),
    price: context.price,
    tokens: context.tokens.basisPoints,
    createdAt: now(),
    canceledAt: null,
  };

};
