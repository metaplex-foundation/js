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
  toMintAccount,
  toTokenAccount,
  findAssociatedTokenAccountPda,
} from '../tokenModule';
import { toMetadataAccount } from './accounts';
import { DisposableScope } from '@/utils';

// -----------------
// Operation
// -----------------

const Key = 'FindTokenWithMetadataByMetadataOperation' as const;
export const findTokenWithMetadataByMetadataOperation =
  useOperation<FindTokenWithMetadataByMetadataOperation>(Key);
export type FindTokenWithMetadataByMetadataOperation = Operation<
  typeof Key,
  FindTokenWithMetadataByMetadataInput,
  TokenWithMetadata
>;

export type FindTokenWithMetadataByMetadataInput = {
  metadataAddress: PublicKey;
  ownerAddress: PublicKey;
  commitment?: Commitment;
  loadJsonMetadata?: boolean; // Default: true
};

// -----------------
// Handler
// -----------------

export const findTokenWithMetadataByMetadataOperationHandler: OperationHandler<FindTokenWithMetadataByMetadataOperation> =
  {
    handle: async (
      operation: FindTokenWithMetadataByMetadataOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<TokenWithMetadata> => {
      const {
        metadataAddress,
        ownerAddress,
        commitment,
        loadJsonMetadata = true,
      } = operation.input;

      const metadataAccount = toMetadataAccount(
        await metaplex.rpc().getAccount(metadataAddress)
      );
      scope.throwIfCanceled();

      const mintAddress = metadataAccount.data.mint;
      const tokenAddress = findAssociatedTokenAccountPda(
        mintAddress,
        ownerAddress
      );
      const accounts = await metaplex
        .rpc()
        .getMultipleAccounts([mintAddress, tokenAddress], commitment);
      scope.throwIfCanceled();

      const mintAccount = toMintAccount(accounts[0]);
      const tokenAccount = toTokenAccount(accounts[1]);
      const mintModel = toMint(mintAccount);

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
