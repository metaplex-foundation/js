import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { TransactionBuilder } from '@/utils';
import { createBurnNftInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findAssociatedTokenAccountPda, TokenProgram } from '../../tokenModule';
import { findMasterEditionV2Pda, findMetadataPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'DeleteNftOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const deleteNftOperation = useOperation<DeleteNftOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type DeleteNftOperation = Operation<
  typeof Key,
  DeleteNftInput,
  DeleteNftOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type DeleteNftInput = {
  // Accounts and models.
  mintAddress: PublicKey;
  owner?: Signer; // Defaults to mx.identity().
  ownerTokenAccount?: PublicKey; // Defaults to associated token account.
  collection?: PublicKey; // Defaults to undefined. I.e. assuming no collection is assigned to the NFT.

  // Programs.
  tokenProgram?: PublicKey; // Defaults to Token Program.

  // Options.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type DeleteNftOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const deleteNftOperationHandler: OperationHandler<DeleteNftOperation> = {
  handle: async (
    operation: DeleteNftOperation,
    metaplex: Metaplex
  ): Promise<DeleteNftOutput> => {
    return deleteNftBuilder(metaplex, operation.input).sendAndConfirm(
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
export type DeleteNftBuilderParams = Omit<DeleteNftInput, 'confirmOptions'> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const deleteNftBuilder = (
  metaplex: Metaplex,
  params: DeleteNftBuilderParams
): TransactionBuilder => {
  const {
    mintAddress,
    owner = metaplex.identity(),
    ownerTokenAccount,
    collection,
    tokenProgram = TokenProgram.publicKey,
  } = params;

  const metadata = findMetadataPda(mintAddress);
  const edition = findMasterEditionV2Pda(mintAddress);
  const tokenAddress =
    ownerTokenAccount ??
    findAssociatedTokenAccountPda(mintAddress, owner.publicKey);

  return TransactionBuilder.make().add({
    instruction: createBurnNftInstruction({
      metadata,
      owner: owner.publicKey,
      mint: mintAddress,
      tokenAccount: tokenAddress,
      masterEditionAccount: edition,
      splTokenProgram: tokenProgram,
      collectionMetadata: collection ? findMetadataPda(collection) : undefined,
    }),
    signers: [owner],
    key: params.instructionKey ?? 'deleteNft',
  });
};
