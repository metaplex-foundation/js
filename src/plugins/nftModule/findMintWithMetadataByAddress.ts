import type { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Operation, useOperation, OperationHandler } from '@/types';
import {
  makeMetadataModel,
  makeMintWithMetadataModel,
  MintWithMetadata,
} from './Metadata';
import { makeMintModel, Mint, toMintAccount } from '../tokenModule';
import { findMetadataPda, parseMetadataAccount } from '@/programs';
import { DisposableScope, removeEmptyChars } from '@/utils';
import { JsonMetadata } from './JsonMetadata';

const Key = 'FindMintWithMetadataByAddressOperation' as const;
export const findMintWithMetadataByAddressOperation =
  useOperation<FindMintWithMetadataByAddressOperation>(Key);
export type FindMintWithMetadataByAddressOperation = Operation<
  typeof Key,
  FindMintWithMetadataByAddressInput,
  MintWithMetadata | Mint
>;

export type FindMintWithMetadataByAddressInput = {
  address: PublicKey;
  commitment?: Commitment;
  loadJsonMetadata?: boolean; // Default: true
};

export const findMintWithMetadataByAddressOperationHandler: OperationHandler<FindMintWithMetadataByAddressOperation> =
  {
    handle: async (
      operation: FindMintWithMetadataByAddressOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<MintWithMetadata | Mint> => {
      const {
        address: mintAddress,
        commitment,
        loadJsonMetadata = true,
      } = operation.input;
      const metadataAddress = findMetadataPda(mintAddress);

      const accounts = await metaplex
        .rpc()
        .getMultipleAccounts([mintAddress, metadataAddress], commitment);

      const mintAccount = toMintAccount(accounts[0]);
      const metadataAccount = parseMetadataAccount(accounts[0]);

      if (!metadataAccount.exists) {
        return makeMintModel(mintAccount);
      }

      const uri = removeEmptyChars(metadataAccount.data.data.uri);
      const json = loadJsonMetadata
        ? await metaplex.storage().downloadJson<JsonMetadata>(uri)
        : undefined;

      let metadataModel = makeMetadataModel(metadataAccount, json);
      if (loadJsonMetadata) {
        metadataModel = await metaplex
          .nfts()
          .loadJsonMetadata(metadataModel)
          .run(scope);
      }

      return makeMintWithMetadataModel(mintAccount, metadataModel);
    },
  };
