import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { TransactionBuilder } from '@/utils';
import { createRevokeUseAuthorityInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey, SystemProgram } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findAssociatedTokenAccountPda, TokenProgram } from '../../tokenModule';
import { findMetadataPda, findUseAuthorityRecordPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'RevokeNftUseAuthorityOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const revokeNftUseAuthorityOperation =
  useOperation<RevokeNftUseAuthorityOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type RevokeNftUseAuthorityOperation = Operation<
  typeof Key,
  RevokeNftUseAuthorityInput,
  RevokeNftUseAuthorityOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type RevokeNftUseAuthorityInput = {
  // Accounts.
  mintAddress: PublicKey;
  user: PublicKey;
  owner?: Signer; // Defaults to mx.identity().
  ownerTokenAddress?: PublicKey; // Defaults to associated token address.

  // Programs.
  tokenProgram?: PublicKey;
  systemProgram?: PublicKey;

  // Options.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type RevokeNftUseAuthorityOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const revokeNftUseAuthorityOperationHandler: OperationHandler<RevokeNftUseAuthorityOperation> =
  {
    handle: async (
      operation: RevokeNftUseAuthorityOperation,
      metaplex: Metaplex
    ): Promise<RevokeNftUseAuthorityOutput> => {
      return revokeNftUseAuthorityBuilder(
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
export type RevokeNftUseAuthorityBuilderParams = Omit<
  RevokeNftUseAuthorityInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const revokeNftUseAuthorityBuilder = (
  metaplex: Metaplex,
  params: RevokeNftUseAuthorityBuilderParams
): TransactionBuilder => {
  const { mintAddress, user, owner = metaplex.identity() } = params;
  const metadata = findMetadataPda(mintAddress);
  const useAuthorityRecord = findUseAuthorityRecordPda(mintAddress, user);
  const ownerTokenAddress =
    params.ownerTokenAddress ??
    findAssociatedTokenAccountPda(mintAddress, owner.publicKey);

  return (
    TransactionBuilder.make()

      // Revoke the use authority.
      .add({
        instruction: createRevokeUseAuthorityInstruction({
          useAuthorityRecord,
          owner: owner.publicKey,
          user,
          ownerTokenAccount: ownerTokenAddress,
          mint: mintAddress,
          metadata,
          tokenProgram: params.tokenProgram ?? TokenProgram.publicKey,
          systemProgram: params.systemProgram ?? SystemProgram.programId,
        }),
        signers: [owner],
        key: params.instructionKey ?? 'revokeUseAuthority',
      })
  );
};
