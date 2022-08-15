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
  mintAddress: PublicKey;
  delegateAuthority: PublicKey;
  amount?: SplTokenAmount;
  owner?: Signer; // Defaults to mx.identity().
  tokenAddress?: PublicKey; // Defaults to associated account.
  multiSigners?: KeypairSigner[]; // Defaults to [].
  tokenProgram?: PublicKey; // Defaults to Token Program.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type ApproveTokenDelegateAuthorityOutput = {
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
  instructionKey?: string;
};

/**
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
