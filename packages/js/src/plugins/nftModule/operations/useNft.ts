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
 * Utilizes a usable NFT.
 *
 * ```ts
 * await metaplex.nfts().use({ mintAddress }).run();
 * await metaplex.nfts().use({ mintAddress, numberOfUses: 3 }).run();
 * ```
 *
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
  /** The address of the mint account. */
  mintAddress: PublicKey;

  /**
   * The number of uses to utilize.
   *
   * @defaultValue `1`
   */
  numberOfUses?: number; // Defaults to 1.

  /**
   * The owner of the NFT or SFT.
   *
   * This must be a Signer unless a `useAuthority` is provided.
   *
   * @defaultValue `metaplex.identity()`
   */
  owner?: PublicKey | Signer;

  /**
   * The address of the token account linking the mint account
   * with the owner account.
   *
   * @defaultValue Defaults to using the associated token account
   * from the `mintAddress` and `owner` parameters.
   */
  ownerTokenAccount?: PublicKey;

  /**
   * The delegated use authority that should authorize this operation.
   *
   * @defaultValue Defaults to not using a delegated use authority
   * and using the `owner` parameter as a Signer instead.
   */
  useAuthority?: Signer;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type UseNftOutput = {
  /** The blockchain response from sending and confirming the transaction. */
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
  /** A key to distinguish the instruction that uses the NFT. */
  instructionKey?: string;
};

/**
 * Utilizes a usable NFT.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .use({ mintAddress });
 * ```
 *
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
