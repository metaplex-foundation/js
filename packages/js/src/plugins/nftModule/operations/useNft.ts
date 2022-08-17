import { ExpectedSignerError } from '@/errors';
import { Metaplex } from '@/Metaplex';
import {
  isSigner,
  Operation,
  OperationHandler,
  Signer,
  toPublicKey,
  useOperation,
} from '@/types';
import { TransactionBuilder } from '@/utils';
import { createUtilizeInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findAssociatedTokenAccountPda } from '../../tokenModule';
import {
  findMetadataPda,
  findProgramAsBurnerPda,
  findUseAuthorityRecordPda,
} from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'UseNftOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const useNftOperation = useOperation<UseNftOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type UseNftOperation = Operation<typeof Key, UseNftInput, UseNftOutput>;

/**
 * @group Operations
 * @category Inputs
 */
export type UseNftInput = {
  // Accounts and models.
  mintAddress: PublicKey;
  numberOfUses?: number; // Defaults to 1.
  owner?: PublicKey | Signer; // Defaults to mx.identity().
  ownerTokenAccount?: PublicKey; // Defaults to associated token account.
  useAuthority?: Signer; // Defaults to not being used.

  // Options.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type UseNftOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const useNftOperationHandler: OperationHandler<UseNftOperation> = {
  handle: async (
    operation: UseNftOperation,
    metaplex: Metaplex
  ): Promise<UseNftOutput> => {
    return useNftBuilder(metaplex, operation.input).sendAndConfirm(
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
export type UseNftBuilderParams = Omit<UseNftInput, 'confirmOptions'> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const useNftBuilder = (
  metaplex: Metaplex,
  params: UseNftBuilderParams
): TransactionBuilder => {
  const {
    mintAddress,
    numberOfUses = 1,
    owner = metaplex.identity(),
    useAuthority,
  } = params;

  if (!isSigner(owner) && !useAuthority) {
    throw new ExpectedSignerError('owner', 'PublicKey', {
      problemSuffix:
        'In order to use an NFT you must either provide the owner as a Signer ' +
        'or a delegated use authority as a Signer.',
    });
  }

  const metadata = findMetadataPda(mintAddress);
  const tokenAccount =
    params.ownerTokenAccount ??
    findAssociatedTokenAccountPda(mintAddress, toPublicKey(owner));
  const useAuthorityRecord = useAuthority
    ? findUseAuthorityRecordPda(mintAddress, useAuthority.publicKey)
    : undefined;
  const programAsBurner = findProgramAsBurnerPda();

  return (
    TransactionBuilder.make()

      // Update the metadata account.
      .add({
        instruction: createUtilizeInstruction(
          {
            metadata,
            tokenAccount,
            useAuthority: useAuthority
              ? useAuthority.publicKey
              : toPublicKey(owner),
            mint: mintAddress,
            owner: toPublicKey(owner),
            useAuthorityRecord,
            burner: useAuthorityRecord ? programAsBurner : undefined,
          },
          { utilizeArgs: { numberOfUses } }
        ),
        signers: [owner, useAuthority].filter(isSigner),
        key: params.instructionKey ?? 'utilizeNft',
      })
  );
};
