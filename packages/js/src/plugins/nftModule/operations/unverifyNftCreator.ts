import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { TransactionBuilder } from '@/utils';
import { createRemoveCreatorVerificationInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findMetadataPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'UnverifyNftCreatorOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const unverifyNftCreatorOperation =
  useOperation<UnverifyNftCreatorOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type UnverifyNftCreatorOperation = Operation<
  typeof Key,
  UnverifyNftCreatorInput,
  UnverifyNftCreatorOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type UnverifyNftCreatorInput = {
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
export type UnverifyNftCreatorOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const unverifyNftCreatorOperationHandler: OperationHandler<UnverifyNftCreatorOperation> =
  {
    handle: async (
      operation: UnverifyNftCreatorOperation,
      metaplex: Metaplex
    ): Promise<UnverifyNftCreatorOutput> => {
      return unverifyNftCreatorBuilder(
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
export type UnverifyNftCreatorBuilderParams = Omit<
  UnverifyNftCreatorInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const unverifyNftCreatorBuilder = (
  metaplex: Metaplex,
  params: UnverifyNftCreatorBuilderParams
): TransactionBuilder => {
  const { mintAddress, creator = metaplex.identity() } = params;

  return (
    TransactionBuilder.make()

      // Verify the creator.
      .add({
        instruction: createRemoveCreatorVerificationInstruction({
          metadata: findMetadataPda(mintAddress),
          creator: creator.publicKey,
        }),
        signers: [creator],
        key: params.instructionKey ?? 'unverifyCreator',
      })
  );
};
