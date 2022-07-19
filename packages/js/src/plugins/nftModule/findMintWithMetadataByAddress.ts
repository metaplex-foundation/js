import type { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Operation, useOperation, OperationHandler } from '@/types';
import {
  toMintWithMetadata,
  MintWithMetadata,
  toLazyMetadata,
  Metadata,
  LazyMetadata,
} from './Metadata';
import { toMint, Mint, toMintAccount } from '../tokenModule';
import { findMetadataPda } from './pdas';
import { parseMetadataAccount } from './accounts';
import { DisposableScope } from '@/utils';

// -----------------
// Operation
// -----------------

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

// -----------------
// Handler
// -----------------

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
      scope.throwIfCanceled();

      const mintAccount = toMintAccount(accounts[0]);

      if (!accounts[1].exists) {
        return toMint(mintAccount);
      }

      const metadataAccount = parseMetadataAccount(accounts[1]);
      let metadataModel: Metadata | LazyMetadata =
        toLazyMetadata(metadataAccount);

      if (loadJsonMetadata) {
        metadataModel = await metaplex
          .nfts()
          .loadMetadata(metadataModel)
          .run(scope);
      }

      return toMintWithMetadata(mintAccount, metadataModel);
    },
  };
