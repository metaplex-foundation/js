import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { toListingReceiptAccount } from '../accounts';
import { AuctionHouse, Listing, toLazyListing } from '../models';
import { DisposableScope } from '@/utils';

// -----------------
// Operation
// -----------------

const Key = 'FindListingByReceiptOperation' as const;

/**
 * Finds a Listing by its receipt address.
 *
 * ```ts
 * const nft = await metaplex
 *   .auctionHouse()
 *   .findListingByReceipt({ receiptAddress, auctionHouse })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findListingByReceiptOperation =
  useOperation<FindListingByReceiptOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindListingByReceiptOperation = Operation<
  typeof Key,
  FindListingByReceiptInput,
  Listing
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindListingByReceiptInput = {
  /**
   * The address of the listing receipt account.
   * This is the account that stores information about this listing.
   * The Listing model is built on top of this account.
   */
  receiptAddress: PublicKey;

  /** A model of the Auction House related to this listing. */
  auctionHouse: AuctionHouse;

  /**
   * Whether or not we should fetch the JSON Metadata for the NFT or SFT.
   *
   * @defaultValue `true`
   */
  loadJsonMetadata?: boolean;

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Handlers
 */
export const findListingByReceiptOperationHandler: OperationHandler<FindListingByReceiptOperation> =
  {
    handle: async (
      operation: FindListingByReceiptOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const { receiptAddress, auctionHouse, commitment } = operation.input;

      const account = toListingReceiptAccount(
        await metaplex.rpc().getAccount(receiptAddress, commitment)
      );
      scope.throwIfCanceled();

      const lazyListing = toLazyListing(account, auctionHouse);
      return metaplex
        .auctionHouse()
        .loadListing({ lazyListing, ...operation.input })
        .run(scope);
    },
  };
