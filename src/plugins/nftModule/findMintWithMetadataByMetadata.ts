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
import { toMintAccount } from '../tokenModule';
import { toMetadataAccount } from '@/programs';
import { DisposableScope } from '@/utils';

// -----------------
// Operation
// -----------------

const Key = 'FindMintWithMetadataByMetadataOperation' as const;
export const findMintWithMetadataByMetadataOperation =
  useOperation<FindMintWithMetadataByMetadataOperation>(Key);
export type FindMintWithMetadataByMetadataOperation = Operation<
  typeof Key,
  FindMintWithMetadataByMetadataInput,
  MintWithMetadata
>;

export type FindMintWithMetadataByMetadataInput = {
  metadataAddress: PublicKey;
  commitment?: Commitment;
  loadJsonMetadata?: boolean; // Default: true
};

// -----------------
// Handler
// -----------------

export const findMintWithMetadataByMetadataOperationHandler: OperationHandler<FindMintWithMetadataByMetadataOperation> =
  {
    handle: async (
      operation: FindMintWithMetadataByMetadataOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<MintWithMetadata> => {
      const {
        metadataAddress,
        commitment,
        loadJsonMetadata = true,
      } = operation.input;

      const metadataAccount = toMetadataAccount(
        await metaplex.rpc().getAccount(metadataAddress, commitment)
      );
      scope.throwIfCanceled();

      const mintAccount = toMintAccount(
        await metaplex.rpc().getAccount(metadataAccount.data.mint, commitment)
      );
      scope.throwIfCanceled();

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
