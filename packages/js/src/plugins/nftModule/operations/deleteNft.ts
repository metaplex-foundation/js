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
 * Deletes an existing NFT.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .delete({ mintAddress })
 *   .run();
 * ```
 *
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
  /** The address of the mint account. */
  mintAddress: PublicKey;

  /**
   * The owner of the NFT as a Signer.
   *
   * @defaultValue `metaplex.identity()`
   */
  owner?: Signer;

  /**
   * The explicit token account linking the provided mint and owner
   * accounts, if that account is not their associated token account.
   *
   * @defaultValue Defaults to using the associated token account
   * from the `mintAddress` and `owner` parameters.
   */
  ownerTokenAccount?: PublicKey;

  /**
   * The address of the Sized Collection NFT associated with the
   * NFT to delete, if any. This is required as the collection NFT
   * will need to decrement its size.
   *
   * @defaultValue Defaults to assuming the NFT is not associated with a
   * Size Collection NFT.
   */
  collection?: PublicKey;

  /** The address of the SPL Token program to override if necessary. */
  tokenProgram?: PublicKey; // Defaults to Token Program.

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type DeleteNftOutput = {
  /** The blockchain response from sending and confirming the transaction. */
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
  /** A key to distinguish the instruction that burns the NFT. */
  instructionKey?: string;
};

/**
 * Deletes an existing NFT.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .delete({ mintAddress });
 * ```
 *
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
