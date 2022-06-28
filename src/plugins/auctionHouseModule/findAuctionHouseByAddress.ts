import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { toAuctionHouseAccount } from './accounts';
import { AuctionHouse, makeAuctionHouseModel } from './AuctionHouse';
import { findMetadataPda, parseMetadataAccount } from '@/programs';
import { makeMintModel, Mint, toMintAccount } from '../tokenModule';
import {
  makeMetadataModel,
  makeMintWithMetadataModel,
  MintWithMetadata,
} from '../nftModule';

// -----------------
// Operation
// -----------------

const Key = 'FindAuctionHouseByAddressOperation' as const;
export const findAuctionHouseByAddressOperation =
  useOperation<FindAuctionHouseByAddressOperation>(Key);
export type FindAuctionHouseByAddressOperation = Operation<
  typeof Key,
  FindAuctionHouseByAddressOperationInput,
  AuctionHouse
>;

export type FindAuctionHouseByAddressOperationInput = {
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
      metaplex: Metaplex
    ) => {
      const { address, commitment } = operation.input;

      const account = toAuctionHouseAccount(
        await metaplex.rpc().getAccount(address, commitment)
      );

      const mintAddress = account.data.treasuryMint;
      const metadataAddress = findMetadataPda(mintAddress);
      const unparsedAccounts = await metaplex
        .rpc()
        .getMultipleAccounts([mintAddress, metadataAddress], commitment);

      const mintAccount = toMintAccount(unparsedAccounts[0]);
      const metadataAccount = parseMetadataAccount(unparsedAccounts[1]);

      let mintModel: Mint | MintWithMetadata;
      if (metadataAccount.exists) {
        const metadataModel = makeMetadataModel(metadataAccount);
        mintModel = makeMintWithMetadataModel(mintAccount, metadataModel);
      } else {
        mintModel = makeMintModel(mintAccount);
      }

      return makeAuctionHouseModel(account, mintModel);
    },
  };
