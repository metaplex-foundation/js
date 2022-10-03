import { createApproveUseAuthorityInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import {
  findMetadataPda,
  findProgramAsBurnerPda,
  findUseAuthorityRecordPda,
} from '../pdas';
import { TransactionBuilder } from '@/utils';
import {
  Operation,
  OperationHandler,
  Program,
  Signer,
  useOperation,
} from '@/types';
import { Metaplex } from '@/Metaplex';

// -----------------
// Operation
// -----------------

const Key = 'ApproveNftUseAuthorityOperation' as const;

/**
 * Approves a new use authority.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .approveUseAuthority({ mintAddress, user })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const approveNftUseAuthorityOperation =
  useOperation<ApproveNftUseAuthorityOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type ApproveNftUseAuthorityOperation = Operation<
  typeof Key,
  ApproveNftUseAuthorityInput,
  ApproveNftUseAuthorityOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type ApproveNftUseAuthorityInput = {
  /** The address of the mint account. */
  mintAddress: PublicKey;

  /** The address of the use authority to approve. */
  user: PublicKey;

  /**
   * The owner of the NFT or SFT as a Signer.
   *
   * @defaultValue `metaplex.identity()`
   */
  owner?: Signer;

  /**
   * The address of the token account linking the mint account
   * with the owner account.
   *
   * @defaultValue Defaults to using the associated token account
   * from the `mintAddress` and `owner` parameters.
   */
  ownerTokenAddress?: PublicKey;

  /**
   * The Signer paying for the creation of the PDA account
   * that keeps track of the new use authority.
   * This account will also pay for the transaction fee.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /**
   * The number of usages this new use authority
   * is allowed to perform.
   *
   * @defaultValue `1`
   */
  numberOfUses?: number;

  /** An optional set of programs that override the registered ones. */
  programs?: Program[];

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type ApproveNftUseAuthorityOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
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

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type ApproveNftUseAuthorityBuilderParams = Omit<
  ApproveNftUseAuthorityInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that approves the use authority. */
  instructionKey?: string;
};

/**
 * Approves a new use authority.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .approveUseAuthority({ mintAddress, user });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const approveNftUseAuthorityBuilder = (
  metaplex: Metaplex,
  params: ApproveNftUseAuthorityBuilderParams
): TransactionBuilder => {
  const {
    mintAddress,
    user,
    owner = metaplex.identity(),
    payer = metaplex.identity(),
    programs,
  } = params;

  const systemProgram = metaplex.programs().getSystem(programs);
  const tokenProgram = metaplex.programs().getToken(programs);
  const tokenMetadataProgram = metaplex.programs().getTokenMetadata(programs);

  const metadata = findMetadataPda(mintAddress);
  const useAuthorityRecord = findUseAuthorityRecordPda(mintAddress, user);
  const programAsBurner = findProgramAsBurnerPda();
  const ownerTokenAddress =
    params.ownerTokenAddress ??
    metaplex.tokens().pdas().associatedTokenAccount({
      mint: mintAddress,
      owner: owner.publicKey,
      programs,
    });

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
            tokenProgram: tokenProgram.address,
            systemProgram: systemProgram.address,
          },
          {
            approveUseAuthorityArgs: {
              numberOfUses: params.numberOfUses ?? 1,
            },
          },
          tokenMetadataProgram.address
        ),
        signers: [owner, payer],
        key: params.instructionKey ?? 'approveUseAuthority',
      })
  );
};
