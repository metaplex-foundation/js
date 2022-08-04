import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { createMintToInstruction } from '@solana/spl-token';
import type { Metaplex } from '@/Metaplex';
import {
  isSigner,
  KeypairSigner,
  Operation,
  OperationHandler,
  Signer,
  SplTokenAmount,
  toPublicKey,
  useOperation,
} from '@/types';
import { TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { isMint, Mint } from './Mint';
import { TokenProgram } from './program';
import { findAssociatedTokenAccountPda } from './pdas';
import type { TokenClient } from './TokenClient';
import type { TokenBuildersClient } from './TokenBuildersClient';

// -----------------
// Clients
// -----------------

/** @internal */
export function _mintTokensClient(this: TokenClient, input: MintTokensInput) {
  return this.metaplex.operations().getTask(mintTokensOperation(input));
}

/** @internal */
export function _mintTokensBuildersClient(
  this: TokenBuildersClient,
  input: MintTokensBuilderParams
) {
  return mintTokensBuilder(this.metaplex, input);
}

// -----------------
// Operation
// -----------------

const Key = 'MintTokensOperation' as const;
export const mintTokensOperation = useOperation<MintTokensOperation>(Key);
export type MintTokensOperation = Operation<
  typeof Key,
  MintTokensInput,
  MintTokensOutput
>;

export type MintTokensInput = {
  mint: PublicKey | Mint;
  amount: SplTokenAmount;
  toOwner?: PublicKey; // Defaults to mx.identity().
  toToken?: PublicKey | Signer; // Defaults to associated account.
  mintAuthority?: PublicKey | Signer; // Defaults to mx.identity().
  multiSigners?: KeypairSigner[]; // Defaults to [].
  payer?: Signer; // Only used to create missing token accounts. Defaults to mx.identity().
  tokenProgram?: PublicKey; // Defaults to Token Program.
  associatedTokenProgram?: PublicKey; // Defaults to Associated Token Program.
  confirmOptions?: ConfirmOptions;
};

export type MintTokensOutput = {
  response: SendAndConfirmTransactionResponse;
};

// -----------------
// Handler
// -----------------

export const mintTokensOperationHandler: OperationHandler<MintTokensOperation> =
  {
    async handle(
      operation: MintTokensOperation,
      metaplex: Metaplex
    ): Promise<MintTokensOutput> {
      const builder = await mintTokensBuilder(metaplex, operation.input);
      return builder.sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

export type MintTokensBuilderParams = Omit<
  MintTokensInput,
  'confirmOptions'
> & {
  toTokenExists?: boolean; // Defaults to false.
  createAssociatedTokenAccountInstructionKey?: string;
  createAccountInstructionKey?: string;
  initializeTokenInstructionKey?: string;
  mintTokensInstructionKey?: string;
};

export const mintTokensBuilder = async (
  metaplex: Metaplex,
  params: MintTokensBuilderParams
): Promise<TransactionBuilder> => {
  const {
    mint,
    amount,
    toOwner = metaplex.identity().publicKey,
    toToken,
    mintAuthority = metaplex.identity(),
    multiSigners = [],
    payer = metaplex.identity(),
    tokenProgram = TokenProgram.publicKey,
  } = params;

  const [mintAuthorityPublicKey, signers] = isSigner(mintAuthority)
    ? [mintAuthority.publicKey, [mintAuthority]]
    : [mintAuthority, multiSigners];

  const mintAddress = isMint(mint) ? mint.address : mint;
  const destination =
    toToken ?? findAssociatedTokenAccountPda(mintAddress, toOwner);

  return (
    TransactionBuilder.make()

      // Create token account if missing.
      .add(
        !(params.toTokenExists ?? false)
          ? await metaplex
              .tokens()
              .builders()
              .createTokenIfMissing({
                ...params,
                mint: mintAddress,
                owner: toOwner,
                token: toToken,
                payer,
                tokenVariable: 'toToken',
              })
          : TransactionBuilder.make()
      )

      // Mint tokens.
      .add({
        instruction: createMintToInstruction(
          mintAddress,
          toPublicKey(destination),
          mintAuthorityPublicKey,
          amount.basisPoints.toNumber(),
          multiSigners,
          tokenProgram
        ),
        signers,
        key: params.mintTokensInstructionKey ?? 'mintTokens',
      })
  );
};
