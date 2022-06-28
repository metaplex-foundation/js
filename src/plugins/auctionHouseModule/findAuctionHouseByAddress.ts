import type { Commitment, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import {
  useOperation,
  Operation,
  OperationHandler,
  assertAccountExists,
} from '@/types';
import { parseAuctionHouseAccount } from './accounts';
import { AuctionHouse, makeAuctionHouseModel } from './AuctionHouse';
import { findMetadataPda, parseMetadataAccount } from '@/programs';
import {
  makeMetadataModel,
  makeMintModel,
  makeMintWithMetadataModel,
  Mint,
  MintWithMetadata,
  parseMintAccount,
} from './modelsToRefactor';

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
      const unparsedAccount = await metaplex
        .rpc()
        .getAccount(address, commitment);

      assertAccountExists(unparsedAccount, 'AuctionHouse');
      const account = parseAuctionHouseAccount(unparsedAccount);

      const mintAddress = account.data.treasuryMint;
      const metadataAddress = findMetadataPda(mintAddress);
      const unparsedAccounts = await metaplex
        .rpc()
        .getMultipleAccounts([mintAddress, metadataAddress], commitment);
      const mintAccount = parseMintAccount(unparsedAccounts[0]);
      const metadataAccount = parseMetadataAccount(unparsedAccounts[1]);
      assertAccountExists(mintAccount, 'Mint');

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
