import type { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Operation, useOperation, OperationHandler } from '@/types';
import { toMetadata, toMintWithMetadata, MintWithMetadata } from './Metadata';
import { toMint, Mint, toMintAccount } from '../tokenModule';
import { findMetadataPda, parseMetadataAccount } from '@/programs';
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

      const mintAccount = toMintAccount(accounts[0]);

      if (!accounts[1].exists) {
        return toMint(mintAccount);
      }

      const metadataAccount = parseMetadataAccount(accounts[1]);
      let metadataModel = toMetadata(metadataAccount);
      if (loadJsonMetadata) {
        metadataModel = await metaplex
          .nfts()
          .loadJsonMetadata(metadataModel)
          .run(scope);
      }

      return toMintWithMetadata(mintAccount, metadataModel);
    },
  };
