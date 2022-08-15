import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { TransactionBuilder } from '@/utils';
import { createSignMetadataInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { HasMintAddress, toMintAddress } from '../helpers';
import type { NftBuildersClient } from '../NftBuildersClient';
import type { NftClient } from '../NftClient';
import { findMetadataPda } from '../pdas';

// -----------------
// Clients
// -----------------

/** @internal */
export function _verifyNftCreatorClient(
  this: NftClient,
  nftOrSft: HasMintAddress,
  creator?: Signer,
  input: Omit<VerifyNftCreatorInput, 'mintAddress' | 'creator'> = {}
) {
  return this.metaplex.operations().getTask(
    verifyNftCreatorOperation({
      ...input,
      mintAddress: toMintAddress(nftOrSft),
      creator,
    })
  );
}

/** @internal */
export function _verifyNftCreatorBuildersClient(
  this: NftBuildersClient,
  input: VerifyNftCreatorBuilderParams
) {
  return verifyNftCreatorBuilder(this.metaplex, input);
}

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
