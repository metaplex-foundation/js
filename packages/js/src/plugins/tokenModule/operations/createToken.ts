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
import { DisposableScope, TransactionBuilder } from '@/utils';
import {
  ACCOUNT_SIZE,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeAccountInstruction,
} from '@solana/spl-token';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findAssociatedTokenAccountPda } from '../pdas';
import { TokenProgram } from '../program';
import { Token } from '../models/Token';

// -----------------
// Operation
// -----------------

const Key = 'CreateTokenOperation' as const;

/**
 * Create a new Token account from the provided input
 * and returns the newly created `Token` model.
 *
 * @group Operations
 * @category Constructors
 */
export const createTokenOperation = useOperation<CreateTokenOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type CreateTokenOperation = Operation<
  typeof Key,
  CreateTokenInput,
  CreateTokenOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type CreateTokenInput = {
  mint: PublicKey;
  owner?: PublicKey; // Defaults to mx.identity().
  token?: Signer; // Defaults to creating an associated token address instead.
  payer?: Signer; // Defaults to mx.identity().
  tokenProgram?: PublicKey; // Defaults to System Program.
  associatedTokenProgram?: PublicKey; // Defaults to Associated Token Program.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type CreateTokenOutput = {
  response: SendAndConfirmTransactionResponse;
  token: Token;
};

/**
 * @group Operations
 * @category Handlers
 */
export const createTokenOperationHandler: OperationHandler<CreateTokenOperation> =
  {
    async handle(
      operation: CreateTokenOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<CreateTokenOutput> {
      const builder = await createTokenBuilder(metaplex, operation.input);
      scope.throwIfCanceled();

      const output = await builder.sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      );
      scope.throwIfCanceled();

      const token = await metaplex
        .tokens()
        .findTokenByAddress({ address: output.tokenAddress })
        .run(scope);

      return { ...output, token };
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type CreateTokenBuilderParams = Omit<
  CreateTokenInput,
  'confirmOptions'
> & {
  createAssociatedTokenAccountInstructionKey?: string;
  createAccountInstructionKey?: string;
  initializeTokenInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CreateTokenBuilderContext = {
  tokenAddress: PublicKey;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
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

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type CreateTokenIfMissingBuilderParams = Omit<
  CreateTokenBuilderParams,
  'token'
> & {
  token?: PublicKey | Signer;
  tokenExists?: boolean; // Defaults to true.
  tokenVariable?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const createTokenIfMissingBuilder = async (
  metaplex: Metaplex,
  params: CreateTokenIfMissingBuilderParams
): Promise<TransactionBuilder<CreateTokenBuilderContext>> => {
  const {
    mint,
    owner = metaplex.identity().publicKey,
    token,
    tokenExists = true,
    payer = metaplex.identity(),
    tokenVariable = 'token',
  } = params;

  const destination = token ?? findAssociatedTokenAccountPda(mint, owner);
  const destinationAddress = toPublicKey(destination);
  const builder = TransactionBuilder.make<CreateTokenBuilderContext>()
    .setFeePayer(payer)
    .setContext({ tokenAddress: destinationAddress });

  if (tokenExists) {
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
