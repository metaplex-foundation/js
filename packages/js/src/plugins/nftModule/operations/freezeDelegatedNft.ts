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

/**
 * @group Operations
 * @category Constructors
 */
export const freezeDelegatedNftOperation =
  useOperation<FreezeDelegatedNftOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FreezeDelegatedNftOperation = Operation<
  typeof Key,
  FreezeDelegatedNftInput,
  FreezeDelegatedNftOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FreezeDelegatedNftInput = {
  mintAddress: PublicKey;
  delegateAuthority: Signer;
  tokenOwner?: PublicKey; // Defaults to mx.identity().
  tokenAddress?: PublicKey; // Defaults to associated account.
  tokenProgram?: PublicKey; // Defaults to Token Program.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type FreezeDelegatedNftOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
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

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type FreezeDelegatedNftBuilderParams = Omit<
  FreezeDelegatedNftInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
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
