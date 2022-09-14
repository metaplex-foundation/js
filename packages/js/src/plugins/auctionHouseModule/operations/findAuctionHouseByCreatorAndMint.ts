import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { findAuctionHousePda } from '../pdas';
import { AuctionHouse } from '../models/AuctionHouse';

// -----------------
// Operation
// -----------------

const Key = 'FindAuctionHouseByCreatorAndMintOperation' as const;

/**
 * Finds an Auction House by its creator and treasury mint.
 *
 * ```ts
 * const nft = await metaplex
 *   .auctionHouse()
 *   .findByCreatorAndMint({ creator, treasuryMint })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findAuctionHouseByCreatorAndMintOperation =
  useOperation<FindAuctionHouseByCreatorAndMintOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindAuctionHouseByCreatorAndMintOperation = Operation<
  typeof Key,
  FindAuctionHouseByCreatorAndMintInput,
  AuctionHouse
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindAuctionHouseByCreatorAndMintInput = {
  /** The address of the Auction House creator. */
  creator: PublicKey;

  /**
   * The address of the Auction House treasury mint.
   * By default Auction House uses the `WRAPPED_SOL_MINT` treasury mint.
   */
  treasuryMint: PublicKey;

  /**
   * The Auctioneer authority key.
   * It is required when Auction House has Auctioneer enabled.
   *
   * @defaultValue No default value.
   */
  auctioneerAuthority?: PublicKey;

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Handlers
 */
export const findAuctionHouseByCreatorAndMintOperationHandler: OperationHandler<FindAuctionHouseByCreatorAndMintOperation> =
  {
    handle: async (
      operation: FindAuctionHouseByCreatorAndMintOperation,
      metaplex: Metaplex
    ) => {
      const { creator, treasuryMint } = operation.input;

      return metaplex
        .auctionHouse()
        .findByAddress({
          address: findAuctionHousePda(creator, treasuryMint),
          ...operation.input,
        })
        .run();
    },
  };
