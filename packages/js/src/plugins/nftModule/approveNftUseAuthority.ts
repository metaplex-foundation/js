import { ConfirmOptions, PublicKey, SystemProgram } from '@solana/web3.js';
import { createApproveUseAuthorityInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { useOperation, Operation, Signer, OperationHandler } from '@/types';
import { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import {
  findMetadataPda,
  findProgramAsBurnerPda,
  findUseAuthorityRecordPda,
} from './pdas';
import type { NftClient } from './NftClient';
import type { NftBuildersClient } from './NftBuildersClient';
import { HasMintAddress, toMintAddress } from './helpers';
import { findAssociatedTokenAccountPda, TokenProgram } from '../tokenModule';

// -----------------
// Clients
// -----------------

/** @internal */
export function _approveNftUseAuthorityClient(
  this: NftClient,
  nftOrSft: HasMintAddress,
  user: PublicKey,
  input: Omit<ApproveNftUseAuthorityInput, 'mintAddress' | 'user'> = {}
) {
  return this.metaplex.operations().getTask(
    approveNftUseAuthorityOperation({
      ...input,
      mintAddress: toMintAddress(nftOrSft),
      user,
    })
  );
}

/** @internal */
export function _approveNftUseAuthorityBuildersClient(
  this: NftBuildersClient,
  input: ApproveNftUseAuthorityBuilderParams
) {
  return approveNftUseAuthorityBuilder(this.metaplex, input);
}

// -----------------
// Operation
// -----------------

const Key = 'ApproveNftUseAuthorityOperation' as const;
export const approveNftUseAuthorityOperation =
  useOperation<ApproveNftUseAuthorityOperation>(Key);
export type ApproveNftUseAuthorityOperation = Operation<
  typeof Key,
  ApproveNftUseAuthorityInput,
  ApproveNftUseAuthorityOutput
>;

export interface ApproveNftUseAuthorityInput {
  // Accounts.
  mintAddress: PublicKey;
  user: PublicKey;
  owner?: Signer; // Defaults to mx.identity().
  ownerTokenAddress?: PublicKey; // Defaults to associated token address.
  payer?: Signer; // Defaults to mx.identity().

  // Data.
  numberOfUses?: number; // Defaults to 1.

  // Programs.
  tokenProgram?: PublicKey;
  systemProgram?: PublicKey;

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface ApproveNftUseAuthorityOutput {
  response: SendAndConfirmTransactionResponse;
}

// -----------------
// Handler
// -----------------

export const approveNftUseAuthorityOperationHandler: OperationHandler<ApproveNftUseAuthorityOperation> =
  {
    handle: async (
      operation: ApproveNftUseAuthorityOperation,
      metaplex: Metaplex
    ): Promise<ApproveNftUseAuthorityOutput> => {
      return approveNftUseAuthorityBuilder(
        metaplex,
        operation.input
      ).sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

export type ApproveNftUseAuthorityBuilderParams = Omit<
  ApproveNftUseAuthorityInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export const approveNftUseAuthorityBuilder = (
  metaplex: Metaplex,
  params: ApproveNftUseAuthorityBuilderParams
): TransactionBuilder => {
  const {
    mintAddress,
    user,
    owner = metaplex.identity(),
    payer = metaplex.identity(),
  } = params;
  const metadata = findMetadataPda(mintAddress);
  const useAuthorityRecord = findUseAuthorityRecordPda(mintAddress, user);
  const programAsBurner = findProgramAsBurnerPda();
  const ownerTokenAddress =
    params.ownerTokenAddress ??
    findAssociatedTokenAccountPda(mintAddress, owner.publicKey);

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Approve the use authority.
      .add({
        instruction: createApproveUseAuthorityInstruction(
          {
            useAuthorityRecord,
            owner: owner.publicKey,
            payer: payer.publicKey,
            user,
            ownerTokenAccount: ownerTokenAddress,
            metadata,
            mint: mintAddress,
            burner: programAsBurner,
            tokenProgram: params.tokenProgram ?? TokenProgram.publicKey,
            systemProgram: params.systemProgram ?? SystemProgram.programId,
          },
          {
            approveUseAuthorityArgs: {
              numberOfUses: params.numberOfUses ?? 1,
            },
          }
        ),
        signers: [owner, payer],
        key: params.instructionKey ?? 'approveUseAuthority',
      })
  );
};
