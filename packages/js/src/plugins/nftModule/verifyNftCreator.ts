import type { NftClient } from './NftClient';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { createSignMetadataInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { useOperation, Operation, Signer, OperationHandler } from '@/types';
import { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { findMetadataPda } from './pdas';

// -----------------
// Client
// -----------------

/** @internal */
export function _verifyNftCreator(this: NftClient) {}

// -----------------
// Operation
// -----------------

const Key = 'VerifyNftCreatorOperation' as const;
export const verifyNftCreatorOperation =
  useOperation<VerifyNftCreatorOperation>(Key);
export type VerifyNftCreatorOperation = Operation<
  typeof Key,
  VerifyNftCreatorInput,
  VerifyNftCreatorOutput
>;

export interface VerifyNftCreatorInput {
  // Accounts.
  mintAddress: PublicKey;
  creator?: Signer; // Defaults to mx.identity().

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface VerifyNftCreatorOutput {
  response: SendAndConfirmTransactionResponse;
}

// -----------------
// Handler
// -----------------

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

export type VerifyNftCreatorBuilderParams = Omit<
  VerifyNftCreatorInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export const verifyNftCreatorBuilder = (
  metaplex: Metaplex,
  params: VerifyNftCreatorBuilderParams
): TransactionBuilder => {
  const { mintAddress, creator = metaplex.identity() } = params;

  return (
    TransactionBuilder.make()

      // Update the metadata account.
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
