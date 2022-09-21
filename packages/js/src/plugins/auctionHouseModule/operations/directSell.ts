import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import {
  now,
  Operation,
  OperationHandler,
  Signer,
  SplTokenAmount,
  useOperation,
} from '@/types';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { AuctionHouse, Bid, LazyListing, Listing, Purchase } from '../models';
import {
  createListingBuilder,
  executeSaleBuilder,
  ExecuteSaleBuilderContext,
} from '@/plugins';

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
  >;

  /**
   * The Auctioneer authority key.
   * It is required when Auction House has Auctioneer enabled.
   *
   * @defaultValue No default value.
   */
  auctioneerAuthority?: Signer;

  /**
   * The token account address that's associated to the asset a listing created is for.
   *
   * @defaultValue Seller's Associated Token Account.
   */
  tokenAccount?: PublicKey;

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
   * Prints receipt for listing and executed sale.
   * The receipt holds information about the purchase and the listing,
   * So it's important to print it if you want to use the `Purchase` or the `Listing` model
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
      return (
        await directSellBuilder(metaplex, operation.input)
      ).sendAndConfirm(metaplex, operation.input.confirmOptions);
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
export type DirectSellBuilderContext = Omit<DirectSellOutput, 'response'>;

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
  const { bid, seller, tokenAccount, tokens, authority, ...rest } = params;

  const listingBuilder = await createListingBuilder(metaplex, {
    mintAccount: bid.asset.mint.address,
    price: bid.price,
    seller,
    authority,
    tokenAccount,
    tokens,
    ...rest,
  });
  const listingContext = listingBuilder.getContext();

  const lazyListing: LazyListing = {
    model: 'listing',
    lazy: true,
    auctionHouse: params.auctionHouse,
    tradeStateAddress: listingContext.sellerTradeState,
    bookkeeperAddress: listingContext.bookkeeper,
    sellerAddress: listingContext.seller,
    metadataAddress: listingContext.metadata,
    receiptAddress: listingContext.receipt,
    purchaseReceiptAddress: null,
    price: bid.price,
    tokens: bid.tokens.basisPoints,
    createdAt: now(),
    canceledAt: null,
  };

  const saleBuilder: TransactionBuilder<ExecuteSaleBuilderContext> =
    await executeSaleBuilder(metaplex, {
      bid,
      auctionHouse: params.auctionHouse,
      listing: lazyListing as Listing,
      ...rest,
    });

  return TransactionBuilder.make<DirectSellBuilderContext>()
    .setContext({
      listing: lazyListing as Listing,
      purchase: {
        model: 'purchase',
        lazy: true,
        auctionHouse: params.auctionHouse,
        buyerAddress: saleBuilder.getContext().buyer,
        sellerAddress: saleBuilder.getContext().seller,
        metadataAddress: saleBuilder.getContext().metadata,
        bookkeeperAddress: saleBuilder.getContext().bookkeeper,
        receiptAddress: saleBuilder.getContext().receipt,
        price: bid.price,
        tokens: saleBuilder.getContext().tokens.basisPoints,
        createdAt: now(),
      } as Purchase,
    })
    .add(listingContext)
    .add(saleBuilder);
};
