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
import { DisposableScope, Option, Task, TransactionBuilder } from '@/utils';
import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { MintAuthorityMustBeSignerToMintInitialSupplyError } from './errors';
import { TokenWithMint } from './Token';
import type { TokenBuildersClient } from './TokenBuildersClient';
import type { TokenClient } from './TokenClient';

// -----------------
// Clients
// -----------------

/** @internal */
export function _createTokenWithMintClient(
  this: TokenClient,
  input: CreateTokenWithMintInput = {}
): Task<CreateTokenWithMintOutput & { token: TokenWithMint }> {
  return new Task(async (scope) => {
    const operation = createTokenWithMintOperation(input);
    const output = await this.metaplex.operations().execute(operation, scope);
    scope.throwIfCanceled();
    const token = await this.findTokenWithMintByMint({
      mint: output.mintSigner.publicKey,
      address: output.tokenAddress,
      addressType: 'token',
    }).run(scope);
    return { ...output, token };
  });
}

/** @internal */
export function _createTokenWithMintBuildersClient(
  this: TokenBuildersClient,
  input: CreateTokenWithMintBuilderParams
) {
  return createTokenWithMintBuilder(this.metaplex, input);
}

// -----------------
// Operation
// -----------------

const Key = 'CreateTokenWithMintOperation' as const;
export const createTokenWithMintOperation =
  useOperation<CreateTokenWithMintOperation>(Key);
export type CreateTokenWithMintOperation = Operation<
  typeof Key,
  CreateTokenWithMintInput,
  CreateTokenWithMintOutput
>;

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

export type CreateTokenWithMintOutput = {
  response: SendAndConfirmTransactionResponse;
  mintSigner: Signer;
  tokenAddress: PublicKey;
};

// -----------------
// Handler
// -----------------

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
      return builder.sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

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

export type CreateTokenWithMintBuilderContext = Omit<
  CreateTokenWithMintOutput,
  'response'
>;

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
          mint: mint.publicKey,
          toToken: tokenAddress,
          toTokenExists: true,
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
