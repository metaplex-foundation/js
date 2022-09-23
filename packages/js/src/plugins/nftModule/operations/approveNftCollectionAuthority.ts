import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { TransactionBuilder } from '@/utils';
import { createApproveCollectionAuthorityInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey, SystemProgram } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findCollectionAuthorityRecordPda, findMetadataPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'ApproveNftCollectionAuthorityOperation' as const;

/**
 * Approves a new collection authority.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .approveCollectionAuthority({
 *     mintAddress,
 *     collectionAuthority,
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const approveNftCollectionAuthorityOperation =
  useOperation<ApproveNftCollectionAuthorityOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type ApproveNftCollectionAuthorityOperation = Operation<
  typeof Key,
  ApproveNftCollectionAuthorityInput,
  ApproveNftCollectionAuthorityOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type ApproveNftCollectionAuthorityInput = {
  /** The address of the mint account. */
  mintAddress: PublicKey;

  /** The address of the collection authority to approve. */
  collectionAuthority: PublicKey;

  /**
   * The update authority of the NFT or SFT as a Signer.
   *
   * @defaultValue `metaplex.identity()`
   */
  updateAuthority?: Signer;

  /**
   * The Signer paying for the creation of the PDA account
   * that keeps track of the new collection authority.
   * This account will also pay for the transaction fee.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /** The address of the SPL System program to override if necessary. */
  systemProgram?: PublicKey;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type ApproveNftCollectionAuthorityOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const approveNftCollectionAuthorityOperationHandler: OperationHandler<ApproveNftCollectionAuthorityOperation> =
  {
    handle: async (
      operation: ApproveNftCollectionAuthorityOperation,
      metaplex: Metaplex
    ): Promise<ApproveNftCollectionAuthorityOutput> => {
      return approveNftCollectionAuthorityBuilder(
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
export type ApproveNftCollectionAuthorityBuilderParams = Omit<
  ApproveNftCollectionAuthorityInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that approves the collection authority. */
  instructionKey?: string;
};

/**
 * Approves a new collection authority.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .approveCollectionAuthority({
 *     mintAddress,
 *     collectionAuthority,
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const approveNftCollectionAuthorityBuilder = (
  metaplex: Metaplex,
  params: ApproveNftCollectionAuthorityBuilderParams
): TransactionBuilder => {
  const {
    mintAddress,
    collectionAuthority,
    updateAuthority = metaplex.identity(),
    payer = metaplex.identity(),
  } = params;
  const metadata = findMetadataPda(mintAddress);
  const collectionAuthorityRecord = findCollectionAuthorityRecordPda(
    mintAddress,
    collectionAuthority
  );

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Approve the collection authority.
      .add({
        instruction: createApproveCollectionAuthorityInstruction({
          collectionAuthorityRecord,
          newCollectionAuthority: collectionAuthority,
          updateAuthority: updateAuthority.publicKey,
          payer: payer.publicKey,
          metadata,
          mint: mintAddress,
          systemProgram: params.systemProgram ?? SystemProgram.programId,
        }),
        signers: [payer, updateAuthority],
        key: params.instructionKey ?? 'approveCollectionAuthority',
      })
  );
};
