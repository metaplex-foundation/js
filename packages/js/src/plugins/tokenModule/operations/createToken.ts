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
 * Creates a new token account.
 *
 * ```ts
 * const { token } = await metaplex.tokens().createToken({ mint }).run();
 * ```
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
  /**
   * The address of the mint account associated
   * with the new token account.
   */
  mint: PublicKey;

  /**
   * The address of the owner of the new token account.
   *
   * @defaultValue `metaplex.identity().publicKey`
   */
  owner?: PublicKey;

  /**
   * The token account as a Signer if we want to create
   * a new token account with a specific address instead of
   * creating a new associated token account.
   *
   * @defaultValue Defaults to creating a new associated token account
   * using the `mint` and `owner` parameters.
   */
  token?: Signer;

  /**
   * The Signer paying for the new token account and
   * for the transaction fee.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /** The address of the SPL Token program to override if necessary. */
  tokenProgram?: PublicKey;

  /** The address of the SPL Associated Token program to override if necessary. */
  associatedTokenProgram?: PublicKey;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type CreateTokenOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;

  /** The newly created token account. */
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
  /** A key to distinguish the instruction that creates the associated token account. */
  createAssociatedTokenAccountInstructionKey?: string;

  /** A key to distinguish the instruction that creates the account. */
  createAccountInstructionKey?: string;

  /** A key to distinguish the instruction that initializes the token account. */
  initializeTokenInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CreateTokenBuilderContext = {
  /** The computed address of the token account to create. */
  tokenAddress: PublicKey;
};

/**
 * Creates a new token account.
 *
 * ```ts
 * const transactionBuilder = await metaplex.tokens().builders().createToken({ mint });
 * ```
 *
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
  /**
   * The token account to create if it does not exist.
   * Here, it may be passed as a PublicKey if and only
   * if it already exists.
   */
  token?: PublicKey | Signer;

  /**
   * Whether or not the token account exists.
   *
   * @defaultValue `true`
   */
  tokenExists?: boolean;

  /**
   * The name of the token variable on the operation that uses
   * this helper token builder.
   *
   * @defaultValue `"token"`
   */
  tokenVariable?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 * @internal
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
