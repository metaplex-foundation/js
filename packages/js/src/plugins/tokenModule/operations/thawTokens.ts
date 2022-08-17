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
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findAssociatedTokenAccountPda } from '../pdas';
import { TokenProgram } from '../program';

// -----------------
// Operation
// -----------------

const Key = 'ThawTokensOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const thawTokensOperation = useOperation<ThawTokensOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type ThawTokensOperation = Operation<
  typeof Key,
  ThawTokensInput,
  ThawTokensOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type ThawTokensInput = {
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
export type ThawTokensOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
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

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type ThawTokensBuilderParams = Omit<
  ThawTokensInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const thawTokensBuilder = (
  metaplex: Metaplex,
  params: ThawTokensBuilderParams
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
    instruction: createThawAccountInstruction(
      tokenAddressOrAta,
      mintAddress,
      authorityPublicKey,
      multiSigners,
      tokenProgram
    ),
    signers,
    key: params.instructionKey ?? 'thawTokens',
  });
};
