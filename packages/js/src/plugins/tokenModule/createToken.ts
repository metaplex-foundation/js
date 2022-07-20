import {
  createInitializeAccountInstruction,
  ACCOUNT_SIZE,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { DisposableScope, TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { findAssociatedTokenAccountPda } from './pdas';
import { TokenProgram } from './program';

// -----------------
// Operation
// -----------------

const Key = 'CreateTokenOperation' as const;
export const createTokenOperation = useOperation<CreateTokenOperation>(Key);
export type CreateTokenOperation = Operation<
  typeof Key,
  CreateTokenInput,
  CreateTokenOutput
>;

export type CreateTokenInput = {
  mint: PublicKey;
  owner?: PublicKey; // Defaults to mx.identity().
  token?: Signer; // Defaults to creating an associated token address instead.
  payer?: Signer; // Defaults to mx.identity().
  tokenProgram?: PublicKey; // Defaults to System Program.
  associatedTokenProgram?: PublicKey; // Defaults to Associated Token Program.
  confirmOptions?: ConfirmOptions;
};

export type CreateTokenOutput = {
  response: SendAndConfirmTransactionResponse;
  tokenAddress: PublicKey;
};

// -----------------
// Handler
// -----------------

export const createTokenOperationHandler: OperationHandler<CreateTokenOperation> =
  {
    async handle(
      operation: CreateTokenOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<CreateTokenOutput> {
      const builder = await createTokenBuilder(metaplex, operation.input);
      scope.throwIfCanceled();
      return builder.sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

export type CreateTokenBuilderParams = Omit<
  CreateTokenInput,
  'confirmOptions'
> & {
  createAssociatedTokenAccountInstructionKey?: string;
  createAccountInstructionKey?: string;
  initializeTokenInstructionKey?: string;
};

export type CreateTokenBuilderContext = Omit<CreateTokenOutput, 'response'>;

export const createTokenBuilder = async (
  metaplex: Metaplex,
  params: CreateTokenBuilderParams
): Promise<TransactionBuilder<CreateTokenBuilderContext>> => {
  const {
    mint,
    owner = metaplex.identity().publicKey,
    token,
    payer = metaplex.identity(),
    tokenProgram = TokenProgram.publicKey,
    associatedTokenProgram = ASSOCIATED_TOKEN_PROGRAM_ID,
  } = params;

  const isAssociatedToken = token === undefined;
  const builder =
    TransactionBuilder.make<CreateTokenBuilderContext>().setFeePayer(payer);

  if (isAssociatedToken) {
    const associatedTokenAddress = findAssociatedTokenAccountPda(
      mint,
      owner,
      tokenProgram,
      associatedTokenProgram
    );

    return (
      builder
        .setContext({ tokenAddress: associatedTokenAddress })

        // Create an associated token account.
        .add({
          instruction: createAssociatedTokenAccountInstruction(
            payer.publicKey,
            associatedTokenAddress,
            owner,
            mint,
            tokenProgram,
            associatedTokenProgram
          ),
          signers: [payer],
          key:
            params.createAssociatedTokenAccountInstructionKey ??
            'createAssociatedTokenAccount',
        })
    );
  }

  return (
    builder
      .setContext({ tokenAddress: token.publicKey })

      // Create an empty account for the Token.
      .add(
        await metaplex
          .system()
          .builders()
          .createAccount({
            payer,
            newAccount: token,
            space: ACCOUNT_SIZE,
            program: tokenProgram,
            instructionKey:
              params.createAccountInstructionKey ?? 'createAccount',
          })
      )

      // Initialize the Token.
      .add({
        instruction: createInitializeAccountInstruction(
          token.publicKey,
          mint,
          owner,
          tokenProgram
        ),
        signers: [token],
        key: params.initializeTokenInstructionKey ?? 'initializeToken',
      })
  );
};
