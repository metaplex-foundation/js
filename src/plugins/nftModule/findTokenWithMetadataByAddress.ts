import type { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Operation, useOperation, OperationHandler } from '@/types';
import {
  toTokenWithMetadata,
  TokenWithMetadata,
  Metadata,
  LazyMetadata,
  toLazyMetadata,
} from './Metadata';
import {
  toMint,
  toTokenWithMint,
  TokenWithMint,
  toMintAccount,
  toTokenAccount,
} from '../tokenModule';
import { parseMetadataAccount } from './accounts';
import { findMetadataPda } from './pdas';
import { DisposableScope } from '@/utils';

// -----------------
// Operation
// -----------------

const Key = 'FindTokenWithMetadataByAddressOperation' as const;
export const findTokenWithMetadataByAddressOperation =
  useOperation<FindTokenWithMetadataByAddressOperation>(Key);
export type FindTokenWithMetadataByAddressOperation = Operation<
  typeof Key,
  FindTokenWithMetadataByAddressInput,
  TokenWithMetadata | TokenWithMint
>;

export type FindTokenWithMetadataByAddressInput = {
  address: PublicKey;
  commitment?: Commitment;
  loadJsonMetadata?: boolean; // Default: true
};

// -----------------
// Handler
// -----------------

export const findTokenWithMetadataByAddressOperationHandler: OperationHandler<FindTokenWithMetadataByAddressOperation> =
  {
    handle: async (
      operation: FindTokenWithMetadataByAddressOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<TokenWithMetadata | TokenWithMint> => {
      const { address, commitment, loadJsonMetadata = true } = operation.input;

      const tokenAccount = toTokenAccount(
        await metaplex.rpc().getAccount(address, commitment)
      );

      const mintAddress = tokenAccount.data.mint;
      const metadataAddress = findMetadataPda(mintAddress);
      const accounts = await metaplex
        .rpc()
        .getMultipleAccounts([mintAddress, metadataAddress], commitment);
      scope.throwIfCanceled();

      const mintAccount = toMintAccount(accounts[0]);
      const metadataAccount = parseMetadataAccount(accounts[1]);
      const mintModel = toMint(mintAccount);

      if (!metadataAccount.exists) {
        return toTokenWithMint(tokenAccount, mintModel);
      }

      let metadataModel: Metadata | LazyMetadata =
        toLazyMetadata(metadataAccount);

      if (loadJsonMetadata) {
        metadataModel = await metaplex
          .nfts()
          .loadMetadata(metadataModel)
          .run(scope);
      }

      return toTokenWithMetadata(tokenAccount, mintModel, metadataModel);
    },
  };
