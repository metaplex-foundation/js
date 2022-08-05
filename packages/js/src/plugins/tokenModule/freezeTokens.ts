import type { Metaplex } from '@/Metaplex';
import {
  isSigner,
  KeypairSigner,
  Operation,
  OperationHandler,
  Signer,
  useOperation,
} from '@/types';
import { TransactionBuilder } from '@/utils';
import { createFreezeAccountInstruction } from '@solana/spl-token';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { findAssociatedTokenAccountPda } from './pdas';
import { TokenProgram } from './program';
import type { TokenBuildersClient } from './TokenBuildersClient';
import type { TokenClient } from './TokenClient';

// -----------------
// Clients
// -----------------

/** @internal */
export function _freezeTokensClient(
  this: TokenClient,
  input: FreezeTokensInput
) {
  return this.metaplex.operations().getTask(freezeTokensOperation(input));
}

/** @internal */
export function _freezeTokensBuildersClient(
  this: TokenBuildersClient,
  input: FreezeTokensBuilderParams
) {
  return freezeTokensBuilder(this.metaplex, input);
}

// -----------------
// Operation
// -----------------

const Key = 'FreezeTokensOperation' as const;
export const freezeTokensOperation = useOperation<FreezeTokensOperation>(Key);
export type FreezeTokensOperation = Operation<
  typeof Key,
  FreezeTokensInput,
  FreezeTokensOutput
>;

export type FreezeTokensInput = {
  mintAddress: PublicKey;
  owner?: PublicKey | Signer; // Defaults to mx.identity().
  tokenAddress?: PublicKey; // Defaults to associated account.
  multiSigners?: KeypairSigner[]; // Defaults to [].
  delegateAuthority?: Signer; // Defaults to not using a delegate authority.
  tokenProgram?: PublicKey; // Defaults to Token Program.
  confirmOptions?: ConfirmOptions;
};

export type FreezeTokensOutput = {
  response: SendAndConfirmTransactionResponse;
};

// -----------------
// Handler
// -----------------

export const freezeTokensOperationHandler: OperationHandler<FreezeTokensOperation> =
  {
    async handle(
      operation: FreezeTokensOperation,
      metaplex: Metaplex
    ): Promise<FreezeTokensOutput> {
      return freezeTokensBuilder(metaplex, operation.input).sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      );
    },
  };

// -----------------
// Builder
// -----------------

export type FreezeTokensBuilderParams = Omit<
  FreezeTokensInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export const freezeTokensBuilder = (
  metaplex: Metaplex,
  params: FreezeTokensBuilderParams
): TransactionBuilder => {
  const {
    mintAddress,
    owner = metaplex.identity().publicKey,
    tokenAddress,
    multiSigners = [],
    delegateAuthority,
    tokenProgram = TokenProgram.publicKey,
  } = params;

  const [ownerPublicKey, signers] = isSigner(owner)
    ? [owner.publicKey, [owner]]
    : [owner, [delegateAuthority, ...multiSigners].filter(isSigner)];

  const tokenAddressOrAta =
    tokenAddress ?? findAssociatedTokenAccountPda(mintAddress, ownerPublicKey);

  return TransactionBuilder.make().add({
    instruction: createFreezeAccountInstruction(
      tokenAddressOrAta,
      mintAddress,
      delegateAuthority ? delegateAuthority.publicKey : ownerPublicKey,
      multiSigners,
      tokenProgram
    ),
    signers,
    key: params.instructionKey ?? 'freezeTokens',
  });
};
