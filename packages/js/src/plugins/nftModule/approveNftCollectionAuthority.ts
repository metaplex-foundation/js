import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { TransactionBuilder } from '@/utils';
import { createApproveCollectionAuthorityInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey, SystemProgram } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { HasMintAddress, toMintAddress } from './helpers';
import type { NftBuildersClient } from './NftBuildersClient';
import type { NftClient } from './NftClient';
import { findCollectionAuthorityRecordPda, findMetadataPda } from './pdas';

// -----------------
// Clients
// -----------------

/** @internal */
export function _approveNftCollectionAuthorityClient(
  this: NftClient,
  nftOrSft: HasMintAddress,
  collectionAuthority: PublicKey,
  input: Omit<
    ApproveNftCollectionAuthorityInput,
    'mintAddress' | 'collectionAuthority'
  > = {}
) {
  return this.metaplex.operations().getTask(
    approveNftCollectionAuthorityOperation({
      ...input,
      mintAddress: toMintAddress(nftOrSft),
      collectionAuthority,
    })
  );
}

/** @internal */
export function _approveNftCollectionAuthorityBuildersClient(
  this: NftBuildersClient,
  input: ApproveNftCollectionAuthorityBuilderParams
) {
  return approveNftCollectionAuthorityBuilder(this.metaplex, input);
}

// -----------------
// Operation
// -----------------

const Key = 'ApproveNftCollectionAuthorityOperation' as const;
export const approveNftCollectionAuthorityOperation =
  useOperation<ApproveNftCollectionAuthorityOperation>(Key);
export type ApproveNftCollectionAuthorityOperation = Operation<
  typeof Key,
  ApproveNftCollectionAuthorityInput,
  ApproveNftCollectionAuthorityOutput
>;

export interface ApproveNftCollectionAuthorityInput {
  // Accounts.
  mintAddress: PublicKey;
  collectionAuthority: PublicKey;
  updateAuthority?: Signer; // Defaults to mx.identity().
  payer?: Signer; // Defaults to mx.identity().

  // Programs.
  systemProgram?: PublicKey;

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface ApproveNftCollectionAuthorityOutput {
  response: SendAndConfirmTransactionResponse;
}

// -----------------
// Handler
// -----------------

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

export type ApproveNftCollectionAuthorityBuilderParams = Omit<
  ApproveNftCollectionAuthorityInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

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
