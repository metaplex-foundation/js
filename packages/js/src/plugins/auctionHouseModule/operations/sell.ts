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
import { AuctionHouse, Bid, Purchase } from '../models';

// -----------------
// Operation
// -----------------

const Key = 'SellOperation' as const;

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
export const sellOperation = useOperation<SellOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type SellOperation = Operation<typeof Key, SellInput, SellOutput>;

/**
 * @group Operations
 * @category Inputs
 */
export type SellInput = {
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
export type SellOutput = {
  /** Seller trade state account address encoding the listing order. */
  sellerTradeState: PublicKey;

  /** Saleer trade state account address encoding the bid order. */
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
export const sellOperationHandler: OperationHandler<SellOperation> = {
  handle: async (operation: SellOperation, metaplex: Metaplex) => {
    const { bid, seller, tokenAccount, tokens, authority, ...rest } =
      operation.input;

    const { listing } = await metaplex
      .auctionHouse()
      .list({
        mintAccount: bid.asset.mint.address,
        price: bid.price,
        seller,
        authority,
        tokenAccount,
        tokens,
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
