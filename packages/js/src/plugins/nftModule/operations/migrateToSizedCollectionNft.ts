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
import { findCollectionAuthorityRecordPda, findMetadataPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'MigrateToSizedCollectionNftOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const migrateToSizedCollectionNftOperation =
  useOperation<MigrateToSizedCollectionNftOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type MigrateToSizedCollectionNftOperation = Operation<
  typeof Key,
  MigrateToSizedCollectionNftInput,
  MigrateToSizedCollectionNftOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type MigrateToSizedCollectionNftInput = {
  // Accounts.
  mintAddress: PublicKey;
  collectionAuthority?: Signer; // Defaults to mx.identity().

  // Data.
  size: BigNumber;
  isDelegated?: boolean; // Defaults to false.

  // Options.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type MigrateToSizedCollectionNftOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
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

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type MigrateToSizedCollectionNftBuilderParams = Omit<
  MigrateToSizedCollectionNftInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
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
