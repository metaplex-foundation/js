import type { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { TransactionBuilder } from '@/utils';
import { createFreezeDelegatedAccountInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findAssociatedTokenAccountPda, TokenProgram } from '../../tokenModule';
import { findMasterEditionV2Pda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'FreezeDelegatedNftOperation' as const;
export const freezeDelegatedNftOperation =
  useOperation<FreezeDelegatedNftOperation>(Key);
export type FreezeDelegatedNftOperation = Operation<
  typeof Key,
  FreezeDelegatedNftInput,
  FreezeDelegatedNftOutput
>;

export type FreezeDelegatedNftInput = {
  mintAddress: PublicKey;
  delegateAuthority: Signer;
  tokenOwner?: PublicKey; // Defaults to mx.identity().
  tokenAddress?: PublicKey; // Defaults to associated account.
  tokenProgram?: PublicKey; // Defaults to Token Program.
  confirmOptions?: ConfirmOptions;
};

export type FreezeDelegatedNftOutput = {
  response: SendAndConfirmTransactionResponse;
};

// -----------------
// Handler
// -----------------

export const freezeDelegatedNftOperationHandler: OperationHandler<FreezeDelegatedNftOperation> =
  {
    async handle(
      operation: FreezeDelegatedNftOperation,
      metaplex: Metaplex
    ): Promise<FreezeDelegatedNftOutput> {
      return freezeDelegatedNftBuilder(
        metaplex,
        operation.input
      ).sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

export type FreezeDelegatedNftBuilderParams = Omit<
  FreezeDelegatedNftInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export const freezeDelegatedNftBuilder = (
  metaplex: Metaplex,
  params: FreezeDelegatedNftBuilderParams
): TransactionBuilder => {
  const {
    mintAddress,
    delegateAuthority,
    tokenOwner = metaplex.identity().publicKey,
    tokenAddress,
    tokenProgram = TokenProgram.publicKey,
  } = params;

  const editionAddress = findMasterEditionV2Pda(mintAddress);
  const tokenAddressOrAta =
    tokenAddress ?? findAssociatedTokenAccountPda(mintAddress, tokenOwner);

  return TransactionBuilder.make().add({
    instruction: createFreezeDelegatedAccountInstruction({
      delegate: delegateAuthority.publicKey,
      tokenAccount: tokenAddressOrAta,
      edition: editionAddress,
      mint: mintAddress,
      tokenProgram,
    }),
    signers: [delegateAuthority],
    key: params.instructionKey ?? 'freezeDelegatedNft',
  });
};
