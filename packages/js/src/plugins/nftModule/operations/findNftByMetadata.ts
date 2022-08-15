import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope } from '@/utils';
import { Commitment, PublicKey } from '@solana/web3.js';
import { toMetadataAccount } from '../accounts';
import { Nft, NftWithToken, Sft, SftWithToken } from '../models';
import type { NftClient } from '../NftClient';

// -----------------
// Clients
// -----------------

/** @internal */
export function _findNftByMetadataClient(
  this: NftClient,
  metadata: PublicKey,
  options?: Omit<FindNftByMetadataInput, 'metadata'>
) {
  return this.metaplex
    .operations()
    .getTask(findNftByMetadataOperation({ metadata, ...options }));
}

// -----------------
// Operation
// -----------------

const Key = 'FindNftByMetadataOperation' as const;
export const findNftByMetadataOperation =
  useOperation<FindNftByMetadataOperation>(Key);
export type FindNftByMetadataOperation = Operation<
  typeof Key,
  FindNftByMetadataInput,
  FindNftByMetadataOutput
>;

export type FindNftByMetadataInput = {
  metadata: PublicKey;
  tokenAddress?: PublicKey;
  tokenOwner?: PublicKey;
  loadJsonMetadata?: boolean;
  commitment?: Commitment;
};

export type FindNftByMetadataOutput = Nft | Sft | NftWithToken | SftWithToken;

// -----------------
// Handler
// -----------------

export const findNftByMetadataOperationHandler: OperationHandler<FindNftByMetadataOperation> =
  {
    handle: async (
      operation: FindNftByMetadataOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<FindNftByMetadataOutput> => {
      const metadata = toMetadataAccount(
        await metaplex.rpc().getAccount(operation.input.metadata)
      );
      scope.throwIfCanceled();

      return metaplex
        .nfts()
        .findByMint(metadata.data.mint, operation.input)
        .run(scope);
    },
  };
