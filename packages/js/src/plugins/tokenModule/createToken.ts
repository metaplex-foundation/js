import { ExpectedSignerError } from '@/errors';
import type { Metaplex } from '@/Metaplex';
import {
  isSigner,
  Operation,
  OperationHandler,
  Signer,
  toPublicKey,
  useOperation,
} from '@/types';
import { DisposableScope, Task, TransactionBuilder } from '@/utils';
import {
  ACCOUNT_SIZE,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeAccountInstruction,
} from '@solana/spl-token';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { findAssociatedTokenAccountPda } from './pdas';
import { TokenProgram } from './program';
import { Token } from './Token';
import type { TokenBuildersClient } from './TokenBuildersClient';
import type { TokenClient } from './TokenClient';

// -----------------
// Clients
// -----------------

/** @internal */
export function _createTokenClient(
  this: TokenClient,
  input: CreateTokenInput
): Task<CreateTokenOutput & { token: Token }> {
  return new Task(async (scope) => {
    const operation = createTokenOperation(input);
    const output = await this.metaplex.operations().execute(operation, scope);
    scope.throwIfCanceled();
    const token = await this.findTokenByAddress(output.tokenAddress).run(scope);
    return { ...output, token };
  });
}

/** @internal */
export function _createTokenBuildersClient(
  this: TokenBuildersClient,
  input: CreateTokenBuilderParams
) {
  return createTokenBuilder(this.metaplex, input);
}

/** @internal */
export function _createTokenIfMissingBuildersClient(
  this: TokenBuildersClient,
  input: CreateTokenIfMissingBuilderParams
) {
  return createTokenIfMissingBuilder(this.metaplex, input);
}

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
      .setFeePayer(payer)
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

export type CreateTokenIfMissingBuilderParams = Omit<
  CreateTokenBuilderParams,
  'token'
> & {
  token?: PublicKey | Signer;
  tokenVariable?: string;
};

export const createTokenIfMissingBuilder = async (
  metaplex: Metaplex,
  params: CreateTokenIfMissingBuilderParams
): Promise<TransactionBuilder<CreateTokenBuilderContext>> => {
  const {
    mint,
    owner = metaplex.identity().publicKey,
    token,
    payer = metaplex.identity(),
    tokenVariable = 'token',
  } = params;

  const destination = token ?? findAssociatedTokenAccountPda(mint, owner);
  const destinationAddress = toPublicKey(destination);
  const destinationAccount = await metaplex
    .rpc()
    .getAccount(destinationAddress);

  const builder = TransactionBuilder.make<CreateTokenBuilderContext>()
    .setFeePayer(payer)
    .setContext({ tokenAddress: destinationAddress });

  if (destinationAccount.exists) {
    return builder;
  }

  // When creating a token account, ensure it is passed as a Signer.
  if (token && !isSigner(token)) {
    throw new ExpectedSignerError(tokenVariable, 'PublicKey', {
      problemSuffix:
        `The provided "${tokenVariable}" account ` +
        `at address [${destinationAddress}] does not exist. ` +
        `Therefore, it needs to be created and passed as a Signer.`,
      solution:
        `If you want to create the "${tokenVariable}" account, then please pass it as a Signer. ` +
        `Alternatively, you can pass the owner account as a PublicKey instead to ` +
        `use (or create) an associated token account.`,
    });
  }

  return builder.add(
    await metaplex
      .tokens()
      .builders()
      .createToken({
        ...params,
        mint,
        owner,
        token,
        payer,
      })
  );
};
