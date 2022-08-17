import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { TransactionBuilder } from '@/utils';
import {
  createUnverifyCollectionInstruction,
  createUnverifySizedCollectionItemInstruction,
} from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import {
  findCollectionAuthorityRecordPda,
  findMasterEditionV2Pda,
  findMetadataPda,
} from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'UnverifyNftCollectionOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const unverifyNftCollectionOperation =
  useOperation<UnverifyNftCollectionOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type UnverifyNftCollectionOperation = Operation<
  typeof Key,
  UnverifyNftCollectionInput,
  UnverifyNftCollectionOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type UnverifyNftCollectionInput = {
  // Accounts and models.
  mintAddress: PublicKey;
  collectionMintAddress: PublicKey;
  collectionAuthority?: Signer; // Defaults to mx.identity().
  payer?: Signer; // Defaults to mx.identity().

  // Data.
  isSizedCollection?: boolean; // Defaults to true.
  isDelegated?: boolean; // Defaults to false.

  // Options.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type UnverifyNftCollectionOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const unverifyNftCollectionOperationHandler: OperationHandler<UnverifyNftCollectionOperation> =
  {
    handle: async (
      operation: UnverifyNftCollectionOperation,
      metaplex: Metaplex
    ): Promise<UnverifyNftCollectionOutput> => {
      return unverifyNftCollectionBuilder(
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
export type UnverifyNftCollectionBuilderParams = Omit<
  UnverifyNftCollectionInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const unverifyNftCollectionBuilder = (
  metaplex: Metaplex,
  params: UnverifyNftCollectionBuilderParams
): TransactionBuilder => {
  const {
    mintAddress,
    collectionMintAddress,
    isSizedCollection = true,
    isDelegated = false,
    collectionAuthority = metaplex.identity(),
    payer = metaplex.identity(),
  } = params;

  const accounts = {
    metadata: findMetadataPda(mintAddress),
    collectionAuthority: collectionAuthority.publicKey,
    payer: payer.publicKey,
    collectionMint: collectionMintAddress,
    collection: findMetadataPda(collectionMintAddress),
    collectionMasterEditionAccount: findMasterEditionV2Pda(
      collectionMintAddress
    ),
    collectionAuthorityRecord: isDelegated
      ? findCollectionAuthorityRecordPda(
          collectionMintAddress,
          collectionAuthority.publicKey
        )
      : undefined,
  };

  const instruction = isSizedCollection
    ? createUnverifySizedCollectionItemInstruction(accounts)
    : createUnverifyCollectionInstruction(accounts);

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Unverify the collection.
      .add({
        instruction: instruction,
        signers: [payer, collectionAuthority],
        key: params.instructionKey ?? 'unverifyCollection',
      })
  );
};
