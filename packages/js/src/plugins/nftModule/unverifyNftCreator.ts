import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { createRemoveCreatorVerificationInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { useOperation, Operation, Signer, OperationHandler } from '@/types';
import { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { findMetadataPda } from './pdas';
import type { NftClient } from './NftClient';
import type { NftBuildersClient } from './NftBuildersClient';
import { HasMintAddress, toMintAddress } from './helpers';

// -----------------
// Clients
// -----------------

/** @internal */
export function _unverifyNftCreatorClient(
  this: NftClient,
  nftOrSft: HasMintAddress,
  creator: Signer,
  input: Omit<UnverifyNftCreatorInput, 'mintAddress' | 'creator'> = {}
) {
  return this.metaplex.operations().getTask(
    unverifyNftCreatorOperation({
      ...input,
      mintAddress: toMintAddress(nftOrSft),
      creator,
    })
  );
}

/** @internal */
export function _unverifyNftCreatorBuildersClient(
  this: NftBuildersClient,
  input: UnverifyNftCreatorBuilderParams
) {
  return unverifyNftCreatorBuilder(this.metaplex, input);
}

// -----------------
// Operation
// -----------------

const Key = 'UnverifyNftCreatorOperation' as const;
export const unverifyNftCreatorOperation =
  useOperation<UnverifyNftCreatorOperation>(Key);
export type UnverifyNftCreatorOperation = Operation<
  typeof Key,
  UnverifyNftCreatorInput,
  UnverifyNftCreatorOutput
>;

export interface UnverifyNftCreatorInput {
  // Accounts.
  mintAddress: PublicKey;
  creator?: Signer; // Defaults to mx.identity().

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface UnverifyNftCreatorOutput {
  response: SendAndConfirmTransactionResponse;
}

// -----------------
// Handler
// -----------------

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

export type UnverifyNftCreatorBuilderParams = Omit<
  UnverifyNftCreatorInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export const unverifyNftCreatorBuilder = (
  metaplex: Metaplex,
  params: UnverifyNftCreatorBuilderParams
): TransactionBuilder => {
  const { mintAddress, creator = metaplex.identity() } = params;

  return (
    TransactionBuilder.make()

      // Update the metadata account.
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
