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
  decimals?: number; // Defaults to 0 decimals.
  initialSupply?: SplTokenAmount; // Defaults to 0 tokens.
  mint?: Signer; // Defaults to new generated Keypair.
  mintAuthority?: Signer | PublicKey; // Defaults to mx.identity().
  freezeAuthority?: Option<PublicKey>; // Defaults to mx.identity().
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
export type CreateTokenWithMintOutput = {
  response: SendAndConfirmTransactionResponse;
  mintSigner: Signer;
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
  createMintAccountInstructionKey?: string;
  initializeMintInstructionKey?: string;
  createAssociatedTokenAccountInstructionKey?: string;
  createTokenAccountInstructionKey?: string;
  initializeTokenInstructionKey?: string;
  mintTokensInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CreateTokenWithMintBuilderContext = {
  mintSigner: Signer;
  tokenAddress: PublicKey;
};

/**
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
