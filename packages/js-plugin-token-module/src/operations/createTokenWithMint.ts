import type { Metaplex } from '@/Metaplex';
import {
  isSigner,
  Operation,
  OperationHandler,
  Signer,
  SplTokenAmount,
  toPublicKey,
  useOperation,
} from '@/types';
import { DisposableScope, Option, TransactionBuilder } from '@/utils';
import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { MintAuthorityMustBeSignerToMintInitialSupplyError } from '../errors';
import { TokenWithMint } from '../models/Token';

// -----------------
// Operation
// -----------------

const Key = 'CreateTokenWithMintOperation' as const;

/**
 * Creates both mint and token accounts in the same transaction.
 *
 * ```ts
 * const { token } = await metaplex.tokens().createTokenWithMint().run();
 * const mint = token.mint;
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const createTokenWithMintOperation =
  useOperation<CreateTokenWithMintOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type CreateTokenWithMintOperation = Operation<
  typeof Key,
  CreateTokenWithMintInput,
  CreateTokenWithMintOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type CreateTokenWithMintInput = {
  /**
   * The number of decimal points used to define token amounts.
   *
   * @defaultValue `0`
   */
  decimals?: number;

  /**
   * The initial amount of tokens to mint to the new token account.
   *
   * @defaultValue `0`
   */
  initialSupply?: SplTokenAmount;

  /**
   * The address of the new mint account as a Signer.
   *
   * @defaultValue `Keypair.generate()`
   */
  mint?: Signer;

  /**
   * The address of the authority that is allowed
   * to mint new tokens to token accounts.
   *
   * It may be required as a Signer in order to
   * mint the initial supply.
   *
   * @defaultValue `metaplex.identity()`
   */
  mintAuthority?: Signer | PublicKey;

  /**
   * The address of the authority that is allowed
   * to freeze token accounts.
   *
   * @defaultValue `metaplex.identity().publicKey`
   */
  freezeAuthority?: Option<PublicKey>;

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
   * The Signer paying for the new mint and token accounts
   * and for the transaction fee.
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
export type CreateTokenWithMintOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;

  /** The new mint account as a Signer. */
  mintSigner: Signer;

  /**
   * A model representing the newly created token
   * account and its associated mint account.
   */
  token: TokenWithMint;
};

/**
 * @group Operations
 * @category Handlers
 */
export const createTokenWithMintOperationHandler: OperationHandler<CreateTokenWithMintOperation> =
  {
    async handle(
      operation: CreateTokenWithMintOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<CreateTokenWithMintOutput> {
      const builder = await createTokenWithMintBuilder(
        metaplex,
        operation.input
      );
      scope.throwIfCanceled();

      const output = await builder.sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      );
      scope.throwIfCanceled();

      const token = await metaplex
        .tokens()
        .findTokenWithMintByMint({
          mint: output.mintSigner.publicKey,
          address: output.tokenAddress,
          addressType: 'token',
        })
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
export type CreateTokenWithMintBuilderParams = Omit<
  CreateTokenWithMintInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that creates the mint account. */
  createMintAccountInstructionKey?: string;

  /** A key to distinguish the instruction that initializes the mint account. */
  initializeMintInstructionKey?: string;

  /** A key to distinguish the instruction that creates the associates token account. */
  createAssociatedTokenAccountInstructionKey?: string;

  /** A key to distinguish the instruction that creates the token account. */
  createTokenAccountInstructionKey?: string;

  /** A key to distinguish the instruction that initializes the token account. */
  initializeTokenInstructionKey?: string;

  /** A key to distinguish the instruction that mints tokens to the token account. */
  mintTokensInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CreateTokenWithMintBuilderContext = {
  /** The mint account to create as a Signer. */
  mintSigner: Signer;

  /** The computed address of the token account to create. */
  tokenAddress: PublicKey;
};

/**
 * Creates both mint and token accounts in the same transaction.
 *
 * ```ts
 * const transactionBuilder = await metaplex.tokens().builders().createTokenWithMint();
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const createTokenWithMintBuilder = async (
  metaplex: Metaplex,
  params: CreateTokenWithMintBuilderParams
): Promise<TransactionBuilder<CreateTokenWithMintBuilderContext>> => {
  const {
    decimals = 0,
    initialSupply,
    mint = Keypair.generate(),
    mintAuthority = metaplex.identity(),
    freezeAuthority = metaplex.identity().publicKey,
    owner = metaplex.identity().publicKey,
    token,
    payer = metaplex.identity(),
    tokenProgram,
    associatedTokenProgram,
  } = params;

  const createMintBuilder = await metaplex
    .tokens()
    .builders()
    .createMint({
      decimals,
      mint,
      payer,
      mintAuthority: toPublicKey(mintAuthority),
      freezeAuthority,
      tokenProgram,
      createAccountInstructionKey:
        params.createMintAccountInstructionKey ?? 'createMintAccount',
      initializeMintInstructionKey:
        params.initializeMintInstructionKey ?? 'initializeMint',
    });

  const createTokenBuilder = await metaplex
    .tokens()
    .builders()
    .createToken({
      mint: mint.publicKey,
      owner,
      token,
      payer,
      tokenProgram,
      associatedTokenProgram,
      createAssociatedTokenAccountInstructionKey:
        params.createAssociatedTokenAccountInstructionKey ??
        'createAssociatedTokenAccount',
      createAccountInstructionKey:
        params.createTokenAccountInstructionKey ?? 'createTokenAccount',
      initializeTokenInstructionKey:
        params.initializeTokenInstructionKey ?? 'initializeToken',
    });

  const { tokenAddress } = createTokenBuilder.getContext();

  const builder = TransactionBuilder.make<CreateTokenWithMintBuilderContext>()
    .setFeePayer(payer)
    .setContext({ mintSigner: mint, tokenAddress })

    // Create the Mint account.
    .add(createMintBuilder)

    // Create the Token account.
    .add(createTokenBuilder);

  // Potentially mint the initial supply to the token account.
  if (!!initialSupply) {
    if (!isSigner(mintAuthority)) {
      throw new MintAuthorityMustBeSignerToMintInitialSupplyError();
    }

    builder.add(
      await metaplex
        .tokens()
        .builders()
        .mint({
          mintAddress: mint.publicKey,
          toToken: tokenAddress,
          amount: initialSupply,
          mintAuthority,
          tokenProgram,
          mintTokensInstructionKey:
            params.mintTokensInstructionKey ?? 'mintTokens',
        })
    );
  }

  return builder;
};
