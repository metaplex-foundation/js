import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { TransactionBuilder } from '@/utils';
import { createRevokeUseAuthorityInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey, SystemProgram } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { findAssociatedTokenAccountPda, TokenProgram } from '../tokenModule';
import { HasMintAddress, toMintAddress } from './helpers';
import type { NftBuildersClient } from './NftBuildersClient';
import type { NftClient } from './NftClient';
import { findMetadataPda, findUseAuthorityRecordPda } from './pdas';

// -----------------
// Clients
// -----------------

/** @internal */
export function _revokeNftUseAuthorityClient(
  this: NftClient,
  nftOrSft: HasMintAddress,
  user: PublicKey,
  input: Omit<RevokeNftUseAuthorityInput, 'mintAddress' | 'user'> = {}
) {
  return this.metaplex.operations().getTask(
    revokeNftUseAuthorityOperation({
      ...input,
      mintAddress: toMintAddress(nftOrSft),
      user,
    })
  );
}

/** @internal */
export function _revokeNftUseAuthorityBuildersClient(
  this: NftBuildersClient,
  input: RevokeNftUseAuthorityBuilderParams
) {
  return revokeNftUseAuthorityBuilder(this.metaplex, input);
}

// -----------------
// Operation
// -----------------

const Key = 'RevokeNftUseAuthorityOperation' as const;
export const revokeNftUseAuthorityOperation =
  useOperation<RevokeNftUseAuthorityOperation>(Key);
export type RevokeNftUseAuthorityOperation = Operation<
  typeof Key,
  RevokeNftUseAuthorityInput,
  RevokeNftUseAuthorityOutput
>;

export interface RevokeNftUseAuthorityInput {
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
}

export interface RevokeNftUseAuthorityOutput {
  response: SendAndConfirmTransactionResponse;
}

// -----------------
// Handler
// -----------------

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

export type RevokeNftUseAuthorityBuilderParams = Omit<
  RevokeNftUseAuthorityInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

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
