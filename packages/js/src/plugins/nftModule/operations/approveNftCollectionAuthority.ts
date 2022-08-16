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
  // Accounts.
  mintAddress: PublicKey;
  collectionAuthority: PublicKey;
  updateAuthority?: Signer; // Defaults to mx.identity().
  payer?: Signer; // Defaults to mx.identity().

  // Programs.
  systemProgram?: PublicKey;

  // Options.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type ApproveNftCollectionAuthorityOutput = {
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
  instructionKey?: string;
};

/**
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
