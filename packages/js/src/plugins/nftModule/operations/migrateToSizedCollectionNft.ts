import { Metaplex } from '@/Metaplex';
import {
  BigNumber,
  Operation,
  OperationHandler,
  Signer,
  useOperation,
} from '@/types';
import { TransactionBuilder } from '@/utils';
import { createSetCollectionSizeInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { HasMintAddress, toMintAddress } from '../helpers';
import type { NftBuildersClient } from '../NftBuildersClient';
import type { NftClient } from '../NftClient';
import { findCollectionAuthorityRecordPda, findMetadataPda } from '../pdas';

// -----------------
// Clients
// -----------------

/** @internal */
export function _migrateToSizedCollectionNftClient(
  this: NftClient,
  collection: HasMintAddress,
  size: BigNumber,
  input: Omit<MigrateToSizedCollectionNftInput, 'mintAddress' | 'size'> = {}
) {
  return this.metaplex.operations().getTask(
    migrateToSizedCollectionNftOperation({
      ...input,
      mintAddress: toMintAddress(collection),
      size,
    })
  );
}

/** @internal */
export function _migrateToSizedCollectionNftBuildersClient(
  this: NftBuildersClient,
  input: MigrateToSizedCollectionNftBuilderParams
) {
  return migrateToSizedCollectionNftBuilder(this.metaplex, input);
}

// -----------------
// Operation
// -----------------

const Key = 'MigrateToSizedCollectionNftOperation' as const;
export const migrateToSizedCollectionNftOperation =
  useOperation<MigrateToSizedCollectionNftOperation>(Key);
export type MigrateToSizedCollectionNftOperation = Operation<
  typeof Key,
  MigrateToSizedCollectionNftInput,
  MigrateToSizedCollectionNftOutput
>;

export interface MigrateToSizedCollectionNftInput {
  // Accounts.
  mintAddress: PublicKey;
  collectionAuthority?: Signer; // Defaults to mx.identity().

  // Data.
  size: BigNumber;
  isDelegated?: boolean; // Defaults to false.

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface MigrateToSizedCollectionNftOutput {
  response: SendAndConfirmTransactionResponse;
}

// -----------------
// Handler
// -----------------

export const migrateToSizedCollectionNftOperationHandler: OperationHandler<MigrateToSizedCollectionNftOperation> =
  {
    handle: async (
      operation: MigrateToSizedCollectionNftOperation,
      metaplex: Metaplex
    ): Promise<MigrateToSizedCollectionNftOutput> => {
      return migrateToSizedCollectionNftBuilder(
        metaplex,
        operation.input
      ).sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

export type MigrateToSizedCollectionNftBuilderParams = Omit<
  MigrateToSizedCollectionNftInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export const migrateToSizedCollectionNftBuilder = (
  metaplex: Metaplex,
  params: MigrateToSizedCollectionNftBuilderParams
): TransactionBuilder => {
  const {
    mintAddress,
    collectionAuthority = metaplex.identity(),
    size,
    isDelegated = false,
  } = params;

  return (
    TransactionBuilder.make()

      // Update the metadata account.
      .add({
        instruction: createSetCollectionSizeInstruction(
          {
            collectionMetadata: findMetadataPda(mintAddress),
            collectionAuthority: collectionAuthority.publicKey,
            collectionMint: mintAddress,
            collectionAuthorityRecord: isDelegated
              ? findCollectionAuthorityRecordPda(
                  mintAddress,
                  collectionAuthority.publicKey
                )
              : undefined,
          },
          { setCollectionSizeArgs: { size } }
        ),
        signers: [collectionAuthority],
        key: params.instructionKey ?? 'setCollectionSize',
      })
  );
};
