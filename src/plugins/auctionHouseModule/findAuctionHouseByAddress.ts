import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { toAuctionHouseAccount } from './accounts';
import { AuctionHouse, toAuctionHouse } from './AuctionHouse';
import { DisposableScope } from '@/utils';

// -----------------
// Operation
// -----------------

const Key = 'FindAuctionHouseByAddressOperation' as const;
export const findAuctionHouseByAddressOperation =
  useOperation<FindAuctionHouseByAddressOperation>(Key);
export type FindAuctionHouseByAddressOperation = Operation<
  typeof Key,
  FindAuctionHouseByAddressInput,
  AuctionHouse
>;

export type FindAuctionHouseByAddressInput = {
  address: PublicKey;
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

export const findAuctionHouseByAddressOperationHandler: OperationHandler<FindAuctionHouseByAddressOperation> =
  {
    handle: async (
      operation: FindAuctionHouseByAddressOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const { address, commitment } = operation.input;

      const account = toAuctionHouseAccount(
        await metaplex.rpc().getAccount(address, commitment)
      );

      const mintModel = await metaplex
        .nfts()
        .findMintWithMetadataByAddress(account.data.treasuryMint, {
          loadJsonMetadata: false,
          commitment,
        })
        .run(scope);

      return toAuctionHouse(account, mintModel);
    },
  };
