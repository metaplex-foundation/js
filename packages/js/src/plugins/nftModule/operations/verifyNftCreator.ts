import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { TransactionBuilder } from '@/utils';
import { createSignMetadataInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findMetadataPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'VerifyNftCreatorOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const verifyNftCreatorOperation =
  useOperation<VerifyNftCreatorOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type VerifyNftCreatorOperation = Operation<
  typeof Key,
  VerifyNftCreatorInput,
  VerifyNftCreatorOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type VerifyNftCreatorInput = {
  // Accounts.
  mintAddress: PublicKey;
  creator?: Signer; // Defaults to mx.identity().

  // Options.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type VerifyNftCreatorOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const verifyNftCreatorOperationHandler: OperationHandler<VerifyNftCreatorOperation> =
  {
    handle: async (
      operation: VerifyNftCreatorOperation,
      metaplex: Metaplex
    ): Promise<VerifyNftCreatorOutput> => {
      return verifyNftCreatorBuilder(metaplex, operation.input).sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      );
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type VerifyNftCreatorBuilderParams = Omit<
  VerifyNftCreatorInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const verifyNftCreatorBuilder = (
  metaplex: Metaplex,
  params: VerifyNftCreatorBuilderParams
): TransactionBuilder => {
  const { mintAddress, creator = metaplex.identity() } = params;

  return (
    TransactionBuilder.make()

      // Verify the creator.
      .add({
        instruction: createSignMetadataInstruction({
          metadata: findMetadataPda(mintAddress),
          creator: creator.publicKey,
        }),
        signers: [creator],
        key: params.instructionKey ?? 'verifyCreator',
      })
  );
};
