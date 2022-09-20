import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { Option } from '@/utils';
import {
  Operation,
  OperationHandler,
  Pda,
  Signer,
  SolAmount,
  SplTokenAmount,
  useOperation,
} from '@/types';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { AuctionHouse, Listing, Purchase } from '../models';

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
  listing: Pick<
    Listing,
    | 'asset'
    | 'auctionHouse'
    | 'canceledAt'
    | 'price'
    | 'sellerAddress'
    | 'tokens'
    | 'tradeStateAddress'
    | 'receiptAddress'
  >;

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
  /** Seller trade state account address encoding the listing order. */
  sellerTradeState: PublicKey;

  /** Buyer trade state account address encoding the bid order. */
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
 * @group Operations
 * @category Handlers
 */
export const directBuyOperationHandler: OperationHandler<DirectBuyOperation> = {
  handle: async (operation: DirectBuyOperation, metaplex: Metaplex) => {
    const { listing, price, buyer, tokenAccount, tokens, authority, ...rest } =
      operation.input;

    const { bid } = await metaplex
      .auctionHouse()
      .bid({
        authority,
        buyer,
        tokenAccount: listing.asset.token.address,
        tokens: tokens || listing.tokens,
        price: price || listing.price,
        mintAccount: listing.asset.mint.address,
        seller: listing.sellerAddress,
        ...rest,
      })
      .run();

    return await metaplex
      .auctionHouse()
      .executeSale({
        bid,
        listing,
        ...rest,
      })
      .run();
  },
};
