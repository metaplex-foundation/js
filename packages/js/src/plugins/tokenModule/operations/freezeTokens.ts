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
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findAssociatedTokenAccountPda } from '../pdas';
import { TokenProgram } from '../program';

// -----------------
// Operation
// -----------------

const Key = 'FreezeTokensOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const freezeTokensOperation = useOperation<FreezeTokensOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FreezeTokensOperation = Operation<
  typeof Key,
  FreezeTokensInput,
  FreezeTokensOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FreezeTokensInput = {
  mintAddress: PublicKey;
  freezeAuthority: PublicKey | Signer;
  tokenOwner?: PublicKey; // Defaults to mx.identity().
  tokenAddress?: PublicKey; // Defaults to associated account.
  multiSigners?: KeypairSigner[]; // Defaults to [].
  tokenProgram?: PublicKey; // Defaults to Token Program.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type FreezeTokensOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
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

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type FreezeTokensBuilderParams = Omit<
  FreezeTokensInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const freezeTokensBuilder = (
  metaplex: Metaplex,
  params: FreezeTokensBuilderParams
): TransactionBuilder => {
  const {
    mintAddress,
    tokenOwner = metaplex.identity().publicKey,
    tokenAddress,
    multiSigners = [],
    freezeAuthority,
    tokenProgram = TokenProgram.publicKey,
  } = params;

  const [authorityPublicKey, signers] = isSigner(freezeAuthority)
    ? [freezeAuthority.publicKey, [freezeAuthority]]
    : [freezeAuthority, multiSigners];

  const tokenAddressOrAta =
    tokenAddress ?? findAssociatedTokenAccountPda(mintAddress, tokenOwner);

  return TransactionBuilder.make().add({
    instruction: createFreezeAccountInstruction(
      tokenAddressOrAta,
      mintAddress,
      authorityPublicKey,
      multiSigners,
      tokenProgram
    ),
    signers,
    key: params.instructionKey ?? 'freezeTokens',
  });
};
