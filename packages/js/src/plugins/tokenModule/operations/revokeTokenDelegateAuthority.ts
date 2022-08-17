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
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findAssociatedTokenAccountPda } from '../pdas';
import { TokenProgram } from '../program';

// -----------------
// Operation
// -----------------

const Key = 'RevokeTokenDelegateAuthorityOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const revokeTokenDelegateAuthorityOperation =
  useOperation<RevokeTokenDelegateAuthorityOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type RevokeTokenDelegateAuthorityOperation = Operation<
  typeof Key,
  RevokeTokenDelegateAuthorityInput,
  RevokeTokenDelegateAuthorityOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type RevokeTokenDelegateAuthorityInput = {
  mintAddress: PublicKey;
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
export type RevokeTokenDelegateAuthorityOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
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

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type RevokeTokenDelegateAuthorityBuilderParams = Omit<
  RevokeTokenDelegateAuthorityInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
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
