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
 * Revokes an existing use authority.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .revokeUseAuthority({ mintAddress, user })
 *   .run();
 * ```
 *
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
  /** The address of the mint account. */
  mintAddress: PublicKey;

  /** The address of the use authority to revoke. */
  user: PublicKey;

  /**
   * The owner of the NFT or SFT as a Signer.
   *
   * @defaultValue `metaplex.identity()`
   */
  owner?: Signer;

  /**
   * The address of the token account linking the mint account
   * with the owner account.
   *
   * @defaultValue Defaults to using the associated token account
   * from the `mintAddress` and `owner` parameters.
   */
  ownerTokenAddress?: PublicKey;

  /** The address of the SPL Token program to override if necessary. */
  tokenProgram?: PublicKey;

  /** The address of the SPL System program to override if necessary. */
  systemProgram?: PublicKey;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type RevokeNftUseAuthorityOutput = {
  /** The blockchain response from sending and confirming the transaction. */
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
  /** A key to distinguish the instruction that revokes the use authority. */
  instructionKey?: string;
};

/**
 * Revokes an existing use authority.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .revokeUseAuthority({ mintAddress, user });
 * ```
 *
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
