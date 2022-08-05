import { Metaplex } from '@/Metaplex';
import {
  isSigner,
  KeypairSigner,
  Operation,
  OperationHandler,
  Signer,
  useOperation,
} from '@/types';
import { TransactionBuilder } from '@/utils';
import { createRevokeInstruction } from '@solana/spl-token';
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
export function _revokeTokenDelegateAuthorityClient(
  this: TokenClient,
  input: RevokeTokenDelegateAuthorityInput
) {
  return this.metaplex
    .operations()
    .getTask(revokeTokenDelegateAuthorityOperation(input));
}

/** @internal */
export function _revokeTokenDelegateAuthorityBuildersClient(
  this: TokenBuildersClient,
  input: RevokeTokenDelegateAuthorityBuilderParams
) {
  return revokeTokenDelegateAuthorityBuilder(this.metaplex, input);
}

// -----------------
// Operation
// -----------------

const Key = 'RevokeTokenDelegateAuthorityOperation' as const;
export const revokeTokenDelegateAuthorityOperation =
  useOperation<RevokeTokenDelegateAuthorityOperation>(Key);
export type RevokeTokenDelegateAuthorityOperation = Operation<
  typeof Key,
  RevokeTokenDelegateAuthorityInput,
  RevokeTokenDelegateAuthorityOutput
>;

export interface RevokeTokenDelegateAuthorityInput {
  mintAddress: PublicKey;
  owner?: Signer; // Defaults to mx.identity().
  tokenAddress?: PublicKey; // Defaults to associated account.
  multiSigners?: KeypairSigner[]; // Defaults to [].
  tokenProgram?: PublicKey; // Defaults to Token Program.
  confirmOptions?: ConfirmOptions;
}

export interface RevokeTokenDelegateAuthorityOutput {
  response: SendAndConfirmTransactionResponse;
}

// -----------------
// Handler
// -----------------

export const revokeTokenDelegateAuthorityOperationHandler: OperationHandler<RevokeTokenDelegateAuthorityOperation> =
  {
    handle: async (
      operation: RevokeTokenDelegateAuthorityOperation,
      metaplex: Metaplex
    ): Promise<RevokeTokenDelegateAuthorityOutput> => {
      return revokeTokenDelegateAuthorityBuilder(
        metaplex,
        operation.input
      ).sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

export type RevokeTokenDelegateAuthorityBuilderParams = Omit<
  RevokeTokenDelegateAuthorityInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export const revokeTokenDelegateAuthorityBuilder = (
  metaplex: Metaplex,
  params: RevokeTokenDelegateAuthorityBuilderParams
): TransactionBuilder => {
  const {
    mintAddress,
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
    instruction: createRevokeInstruction(
      tokenAccount,
      ownerPublicKey,
      multiSigners,
      tokenProgram
    ),
    signers,
    key: params.instructionKey ?? 'revokeDelegateAuthority',
  });
};
