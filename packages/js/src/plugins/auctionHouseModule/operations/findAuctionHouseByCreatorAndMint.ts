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
  creator: PublicKey;
  treasuryMint: PublicKey;
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
