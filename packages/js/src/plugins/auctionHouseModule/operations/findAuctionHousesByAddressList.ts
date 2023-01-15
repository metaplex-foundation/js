import { PublicKey } from '@solana/web3.js';
import { toAuctioneerAccount, toAuctionHouseAccount } from '../accounts';
import { AuctionHouse, toAuctionHouse } from '../models';
import { toMint, toMintAccount } from '../../tokenModule';
import { chunk } from '../../../utils/common';
import {
  Operation,
  OperationHandler,
  OperationScope,
  UnparsedMaybeAccount,
  useOperation,
} from '@/types';
import { Metaplex } from '@/Metaplex';

// -----------------
// Operation
// -----------------

const Key = 'FindAuctionHousesByAddressListOperation' as const;

/**
 * Finds multiple Auction Houses by their address.
 *
 * ```ts
 * const nft = await metaplex
 *   .auctionHouse()
 *   .findByAddressList({ addresses };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findAuctionHousesByAddressListOperation =
  useOperation<FindAuctionHousesByAddressListOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindAuctionHousesByAddressListOperation = Operation<
  typeof Key,
  FindAuctionHousesByAddressListInput,
  FindAuctionHousesByAddressListOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindAuctionHousesByAddressListInput = {
  /** The addresses of the Auction Houses. */
  addresses: PublicKey[];
};

/**
 * @group Operations
 * @category Outputs
 */
export type FindAuctionHousesByAddressListOutput = AuctionHouse[];

const fetchUniqueAccountMap: <T = UnparsedMaybeAccount>(
  metaplex: Metaplex,
  accounts: PublicKey[],
  mapper: (account: UnparsedMaybeAccount) => T,
  accountMap?: Map<PublicKey, T>
) => Promise<Map<PublicKey, T>> = async (
  metaplex,
  accounts,
  mapper, // = (account) => account,
  accountMap = new Map()
) => {
  const uniqueAccounts: Set<PublicKey> = new Set(
    accounts.filter((key): key is PublicKey => key !== null)
  );

  const accountInfos = await Promise.all(
    chunk(Array.from(uniqueAccounts), 100).map((chunk) =>
      metaplex.rpc().getMultipleAccounts(chunk)
    )
  ).then((infos) => infos.flat());

  for (const account of accountInfos) {
    accountMap.set(account.publicKey, mapper(account));
  }

  return accountMap;
};

/**
 * @group Operations
 * @category Handlers
 */
export const findAuctionHousesByAddressListOperationHandler: OperationHandler<FindAuctionHousesByAddressListOperation> =
  {
    handle: async (
      operation: FindAuctionHousesByAddressListOperation,
      metaplex: Metaplex,
      scope: OperationScope
    ): Promise<FindAuctionHousesByAddressListOutput> => {
      const { commitment } = scope;
      const { addresses } = operation.input;

      const auctionHouseUnparsedAccounts = await Promise.all(
        chunk(addresses, 100).map((c) =>
          metaplex.rpc().getMultipleAccounts(c, commitment)
        )
      );
      scope.throwIfCanceled();

      const auctionHouseAccounts = auctionHouseUnparsedAccounts
        .flat()
        .map((account) => toAuctionHouseAccount(account));

      const mintAddresses = auctionHouseAccounts.map(
        (auctionHouseAccount) => auctionHouseAccount.data.treasuryMint
      );
      const auctioneerAddresses = auctionHouseAccounts
        .map(({ data: { hasAuctioneer, auctioneerAddress } }) =>
          hasAuctioneer ? auctioneerAddress : null
        )
        .filter((key): key is PublicKey => key !== null);

      const mintAndAuctioneerAccounts = await fetchUniqueAccountMap(
        metaplex,
        mintAddresses.concat(auctioneerAddresses),
        (a) => a
      );
      scope.throwIfCanceled();

      return auctionHouseAccounts.map((auctionHouseAccount) => {
        const mintModel = toMint(
          toMintAccount(
            mintAndAuctioneerAccounts.get(
              auctionHouseAccount.data.treasuryMint
            )!
          )
        );

        if (!auctionHouseAccount.data.hasAuctioneer)
          return toAuctionHouse(auctionHouseAccount, mintModel);

        return toAuctionHouse(
          auctionHouseAccount,
          mintModel,
          toAuctioneerAccount(
            mintAndAuctioneerAccounts.get(
              auctionHouseAccount.data.auctioneerAddress
            )!
          )
        );
      });
    },
  };
