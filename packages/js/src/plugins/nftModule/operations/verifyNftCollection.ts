import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { TransactionBuilder } from '@/utils';
import {
  createVerifyCollectionInstruction,
  createVerifySizedCollectionItemInstruction,
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

const Key = 'VerifyNftCollectionOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const verifyNftCollectionOperation =
  useOperation<VerifyNftCollectionOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type VerifyNftCollectionOperation = Operation<
  typeof Key,
  VerifyNftCollectionInput,
  VerifyNftCollectionOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type VerifyNftCollectionInput = {
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
export type VerifyNftCollectionOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const verifyNftCollectionOperationHandler: OperationHandler<VerifyNftCollectionOperation> =
  {
    handle: async (
      operation: VerifyNftCollectionOperation,
      metaplex: Metaplex
    ): Promise<VerifyNftCollectionOutput> => {
      return verifyNftCollectionBuilder(
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
export type VerifyNftCollectionBuilderParams = Omit<
  VerifyNftCollectionInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const verifyNftCollectionBuilder = (
  metaplex: Metaplex,
  params: VerifyNftCollectionBuilderParams
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
  };

  const instruction = isSizedCollection
    ? createVerifySizedCollectionItemInstruction(accounts)
    : createVerifyCollectionInstruction(accounts);

  if (isDelegated) {
    instruction.keys.push({
      pubkey: findCollectionAuthorityRecordPda(
        collectionMintAddress,
        collectionAuthority.publicKey
      ),
      isWritable: false,
      isSigner: false,
    });
  }

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Verify the collection.
      .add({
        instruction: instruction,
        signers: [payer, collectionAuthority],
        key: params.instructionKey ?? 'verifyCollection',
      })
  );
};
