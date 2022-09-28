import { Metaplex } from '@/Metaplex';
import {
  isSigner,
  KeypairSigner,
  Operation,
  OperationHandler,
  Signer,
  SplTokenAmount,
  token,
  useOperation,
} from '@/types';
import { TransactionBuilder } from '@/utils';
import { createApproveInstruction } from '@solana/spl-token';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findAssociatedTokenAccountPda } from '../pdas';
import { TokenProgram } from '../program';

// -----------------
// Operation
// -----------------

const Key = 'ApproveTokenDelegateAuthorityOperation' as const;

/**
 * Approves a delegate authority for a token account.
 *
 * ```ts
 * await metaplex
 *   .tokens()
 *   .approveDelegateAuthority({
 *     delegateAuthority,
 *     mintAddress,
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const approveTokenDelegateAuthorityOperation =
  useOperation<ApproveTokenDelegateAuthorityOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type ApproveTokenDelegateAuthorityOperation = Operation<
  typeof Key,
  ApproveTokenDelegateAuthorityInput,
  ApproveTokenDelegateAuthorityOutput
>;

/**
 * @group Operations
 * @category Inputs
 * */
export type ApproveTokenDelegateAuthorityInput = {
  /** The address of the mint account. */
  mintAddress: PublicKey;

  /** The address of the new delegate authority. */
  delegateAuthority: PublicKey;

  /**
   * The maximum amount of tokens that can be manipulated
   * by the new delegate authority.
   *
   * @defaultValue `token(1)`
   */
  amount?: SplTokenAmount;

  /**
   * The owner of the token account as a Signer.
   *
   * This may be provided as a PublicKey if and only if
   * the `multiSigners` parameter is provided.
   *
   * @defaultValue `metaplex.identity()`
   */
  owner?: Signer | PublicKey;

  /**
   * The address of the token account.
   *
   * @defaultValue Defaults to using the associated token account
   * from the `mintAddress` and `owner` parameters.
   */
  tokenAddress?: PublicKey;

  /**
   * The signing accounts to use if the token owner is a multisig.
   *
   * @defaultValue `[]`
   */
  multiSigners?: KeypairSigner[];

  /** The address of the SPL Token program to override if necessary. */
  tokenProgram?: PublicKey;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type ApproveTokenDelegateAuthorityOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const approveTokenDelegateAuthorityOperationHandler: OperationHandler<ApproveTokenDelegateAuthorityOperation> =
  {
    handle: async (
      operation: ApproveTokenDelegateAuthorityOperation,
      metaplex: Metaplex
    ): Promise<ApproveTokenDelegateAuthorityOutput> => {
      return approveTokenDelegateAuthorityBuilder(
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
export type ApproveTokenDelegateAuthorityBuilderParams = Omit<
  ApproveTokenDelegateAuthorityInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that approves the delegate authority. */
  instructionKey?: string;
};

/**
 * Approves a delegate authority for a token account.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .tokens()
 *   .builders()
 *   .approveDelegateAuthority({
 *     delegateAuthority,
 *     mintAddress,
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const approveTokenDelegateAuthorityBuilder = (
  metaplex: Metaplex,
  params: ApproveTokenDelegateAuthorityBuilderParams
): TransactionBuilder => {
  const {
    mintAddress,
    delegateAuthority,
    amount = token(1),
    owner = metaplex.identity(),
    tokenAddress,
    multiSigners = [],
    tokenProgram = TokenProgram.publicKey,
  } = params;

  const [ownerPublicKey, signers] = isSigner(owner)
    ? [owner.publicKey, [owner]]
    : [owner, multiSigners];

  const tokenAddressOrAta =
    tokenAddress ?? findAssociatedTokenAccountPda(mintAddress, ownerPublicKey);

  return TransactionBuilder.make().add({
    instruction: createApproveInstruction(
      tokenAddressOrAta,
      delegateAuthority,
      ownerPublicKey,
      amount.basisPoints.toNumber(),
      multiSigners,
      tokenProgram
    ),
    signers,
    key: params.instructionKey ?? 'approveDelegateAuthority',
  });
};
