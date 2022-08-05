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
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { findAssociatedTokenAccountPda } from './pdas';
import { TokenProgram } from './program';
import { TokenBuildersClient } from './TokenBuildersClient';
import { TokenClient } from './TokenClient';

// -----------------
// Clients
// -----------------

/** @internal */
export function _approveTokenDelegateAuthorityClient(
  this: TokenClient,
  input: ApproveTokenDelegateAuthorityInput
) {
  return this.metaplex
    .operations()
    .getTask(approveTokenDelegateAuthorityOperation(input));
}

/** @internal */
export function _approveTokenDelegateAuthorityBuildersClient(
  this: TokenBuildersClient,
  input: ApproveTokenDelegateAuthorityBuilderParams
) {
  return approveTokenDelegateAuthorityBuilder(this.metaplex, input);
}

// -----------------
// Operation
// -----------------

const Key = 'ApproveTokenDelegateAuthorityOperation' as const;
export const approveTokenDelegateAuthorityOperation =
  useOperation<ApproveTokenDelegateAuthorityOperation>(Key);
export type ApproveTokenDelegateAuthorityOperation = Operation<
  typeof Key,
  ApproveTokenDelegateAuthorityInput,
  ApproveTokenDelegateAuthorityOutput
>;

export interface ApproveTokenDelegateAuthorityInput {
  mintAddress: PublicKey;
  delegateAuthority: PublicKey;
  amount?: SplTokenAmount;
  owner?: Signer; // Defaults to mx.identity().
  tokenAddress?: PublicKey; // Defaults to associated account.
  multiSigners?: KeypairSigner[]; // Defaults to [].
  tokenProgram?: PublicKey; // Defaults to Token Program.
  confirmOptions?: ConfirmOptions;
}

export interface ApproveTokenDelegateAuthorityOutput {
  response: SendAndConfirmTransactionResponse;
}

// -----------------
// Handler
// -----------------

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

export type ApproveTokenDelegateAuthorityBuilderParams = Omit<
  ApproveTokenDelegateAuthorityInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

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

  const tokenAccount =
    tokenAddress ?? findAssociatedTokenAccountPda(mintAddress, ownerPublicKey);

  return TransactionBuilder.make().add({
    instruction: createApproveInstruction(
      tokenAccount,
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
