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
import { createThawAccountInstruction } from '@solana/spl-token';
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
export function _thawTokensClient(this: TokenClient, input: ThawTokensInput) {
  return this.metaplex.operations().getTask(thawTokensOperation(input));
}

/** @internal */
export function _thawTokensBuildersClient(
  this: TokenBuildersClient,
  input: ThawTokensBuilderParams
) {
  return thawTokensBuilder(this.metaplex, input);
}

// -----------------
// Operation
// -----------------

const Key = 'ThawTokensOperation' as const;
export const thawTokensOperation = useOperation<ThawTokensOperation>(Key);
export type ThawTokensOperation = Operation<
  typeof Key,
  ThawTokensInput,
  ThawTokensOutput
>;

export type ThawTokensInput = {
  mintAddress: PublicKey;
  owner?: PublicKey | Signer; // Defaults to mx.identity().
  tokenAddress?: PublicKey; // Defaults to associated account.
  multiSigners?: KeypairSigner[]; // Defaults to [].
  delegateAuthority?: Signer; // Defaults to not using a delegate authority.
  tokenProgram?: PublicKey; // Defaults to Token Program.
  confirmOptions?: ConfirmOptions;
};

export type ThawTokensOutput = {
  response: SendAndConfirmTransactionResponse;
};

// -----------------
// Handler
// -----------------

export const thawTokensOperationHandler: OperationHandler<ThawTokensOperation> =
  {
    async handle(
      operation: ThawTokensOperation,
      metaplex: Metaplex
    ): Promise<ThawTokensOutput> {
      return thawTokensBuilder(metaplex, operation.input).sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      );
    },
  };

// -----------------
// Builder
// -----------------

export type ThawTokensBuilderParams = Omit<
  ThawTokensInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export const thawTokensBuilder = (
  metaplex: Metaplex,
  params: ThawTokensBuilderParams
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
    instruction: createThawAccountInstruction(
      tokenAddressOrAta,
      mintAddress,
      delegateAuthority ? delegateAuthority.publicKey : ownerPublicKey,
      multiSigners,
      tokenProgram
    ),
    signers,
    key: params.instructionKey ?? 'thawTokens',
  });
};
