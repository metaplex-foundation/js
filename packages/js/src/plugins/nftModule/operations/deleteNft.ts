import { createBurnNftInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '@/Metaplex';
import {
  Operation,
  OperationHandler,
  OperationScope,
  Signer,
  useOperation,
} from '@/types';
import { TransactionBuilder, TransactionBuilderOptions } from '@/utils';

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
 *   .delete({ mintAddress };
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
    metaplex: Metaplex,
    scope: OperationScope
  ): Promise<DeleteNftOutput> => {
    return deleteNftBuilder(metaplex, operation.input, scope).sendAndConfirm(
      metaplex,
      scope.confirmOptions
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
  params: DeleteNftBuilderParams,
  options: TransactionBuilderOptions = {}
): TransactionBuilder => {
  const { programs, payer = metaplex.rpc().getDefaultFeePayer() } = options;
  const {
    mintAddress,
    owner = metaplex.identity(),
    ownerTokenAccount,
    collection,
  } = params;

  const tokenProgram = metaplex.programs().getToken(programs);
  const tokenMetadataProgram = metaplex.programs().getTokenMetadata(programs);

  const metadata = metaplex.nfts().pdas().metadata({
    mint: mintAddress,
    programs,
  });
  const edition = metaplex.nfts().pdas().masterEdition({
    mint: mintAddress,
    programs,
  });
  const tokenAddress =
    ownerTokenAccount ??
    metaplex.tokens().pdas().associatedTokenAccount({
      mint: mintAddress,
      owner: owner.publicKey,
      programs,
    });

  return TransactionBuilder.make()
    .setFeePayer(payer)
    .add({
      instruction: createBurnNftInstruction(
        {
          metadata,
          owner: owner.publicKey,
          mint: mintAddress,
          tokenAccount: tokenAddress,
          masterEditionAccount: edition,
          splTokenProgram: tokenProgram.address,
          collectionMetadata: collection
            ? metaplex.nfts().pdas().metadata({ mint: collection, programs })
            : undefined,
        },
        tokenMetadataProgram.address
      ),
      signers: [owner],
      key: params.instructionKey ?? 'deleteNft',
    });
};
