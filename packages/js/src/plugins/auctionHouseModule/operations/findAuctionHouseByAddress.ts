import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { DisposableScope } from '@/utils';
import { toAuctioneerAccount, toAuctionHouseAccount } from '../accounts';
import { findAuctioneerPda } from '../pdas';
import { AuctioneerAuthorityRequiredError } from '../errors';
import { AuctionHouse, toAuctionHouse } from '../models/AuctionHouse';

// -----------------
// Operation
// -----------------

const Key = 'FindAuctionHouseByAddressOperation' as const;

/**
 * Finds an Auction House by its address.
 *
 * ```ts
 * const nft = await metaplex
 *   .auctionHouse()
 *   .findByAddress({ address })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findAuctionHouseByAddressOperation =
  useOperation<FindAuctionHouseByAddressOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindAuctionHouseByAddressOperation = Operation<
  typeof Key,
  FindAuctionHouseByAddressInput,
  AuctionHouse
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindAuctionHouseByAddressInput = {
  /** The address of the Auction House. */
  address: PublicKey;

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
export const findAuctionHouseByAddressOperationHandler: OperationHandler<FindAuctionHouseByAddressOperation> =
  {
    handle: async (
      operation: FindAuctionHouseByAddressOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const { address, auctioneerAuthority, commitment } = operation.input;
      const auctioneerPda = auctioneerAuthority
        ? findAuctioneerPda(address, auctioneerAuthority)
        : undefined;
      const accountsToFetch = [address, auctioneerPda].filter(
        (account): account is PublicKey => !!account
      );

      const accounts = await metaplex
        .rpc()
        .getMultipleAccounts(accountsToFetch, commitment);
      scope.throwIfCanceled();

      const auctionHouseAccount = toAuctionHouseAccount(accounts[0]);
      const mintModel = await metaplex
        .tokens()
        .findMintByAddress({
          address: auctionHouseAccount.data.treasuryMint,
          commitment,
        })
        .run(scope);
      scope.throwIfCanceled();

      if (!auctionHouseAccount.data.hasAuctioneer) {
        return toAuctionHouse(auctionHouseAccount, mintModel);
      }

      if (!accounts[1] || !accounts[1].exists) {
        throw new AuctioneerAuthorityRequiredError();
      }

      const auctioneerAccount = toAuctioneerAccount(accounts[1]);
      return toAuctionHouse(auctionHouseAccount, mintModel, auctioneerAccount);
    },
  };
