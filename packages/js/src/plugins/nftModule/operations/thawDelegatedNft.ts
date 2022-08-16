import type { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { TransactionBuilder } from '@/utils';
import { createThawDelegatedAccountInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findAssociatedTokenAccountPda, TokenProgram } from '../../tokenModule';
import { findMasterEditionV2Pda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'ThawDelegatedNftOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const thawDelegatedNftOperation =
  useOperation<ThawDelegatedNftOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type ThawDelegatedNftOperation = Operation<
  typeof Key,
  ThawDelegatedNftInput,
  ThawDelegatedNftOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type ThawDelegatedNftInput = {
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
export type ThawDelegatedNftOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const thawDelegatedNftOperationHandler: OperationHandler<ThawDelegatedNftOperation> =
  {
    async handle(
      operation: ThawDelegatedNftOperation,
      metaplex: Metaplex
    ): Promise<ThawDelegatedNftOutput> {
      return thawDelegatedNftBuilder(metaplex, operation.input).sendAndConfirm(
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
export type ThawDelegatedNftBuilderParams = Omit<
  ThawDelegatedNftInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const thawDelegatedNftBuilder = (
  metaplex: Metaplex,
  params: ThawDelegatedNftBuilderParams
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
    instruction: createThawDelegatedAccountInstruction({
      delegate: delegateAuthority.publicKey,
      tokenAccount: tokenAddressOrAta,
      edition: editionAddress,
      mint: mintAddress,
      tokenProgram,
    }),
    signers: [delegateAuthority],
    key: params.instructionKey ?? 'thawDelegatedNft',
  });
};
