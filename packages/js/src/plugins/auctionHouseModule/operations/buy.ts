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

const Key = 'BuyOperation' as const;

/**
 * Creates a bid on a given asset and then executes a sale on the created bid and listing.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .buy({ auctionHouse, bid })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const buyOperation = useOperation<BuyOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type BuyOperation = Operation<typeof Key, BuyInput, BuyOutput>;

/**
 * @group Operations
 * @category Inputs
 */
export type BuyInput = {
  /** The Auction House in which to create a Bid and execute a Sale. */
  auctionHouse: AuctionHouse;

  /**
   * The Listing that is used in the sale.
   */
  listing: Pick<
    Listing,
    | 'asset'
    | 'auctionHouse'
    | 'canceledAt'
    | 'sellerAddress'
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
   * The buyer's price.
   *
   * @defaultValue 0 SOLs or tokens.
   */
  price?: SolAmount | SplTokenAmount;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type BuyOutput = {
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
export const buyOperationHandler: OperationHandler<BuyOperation> = {
  handle: async (operation: BuyOperation, metaplex: Metaplex) => {
    const { auctionHouse, listing, price } = operation.input;

    const { bid } = await metaplex
      .auctionHouse()
      .bid({
        auctionHouse,
        mintAccount: listing.asset.mint.address,
        price,
      })
      .run();

    return await metaplex
      .auctionHouse()
      .executeSale({
        auctionHouse,
        listing,
        bid,
      })
      .run();
  },
};
