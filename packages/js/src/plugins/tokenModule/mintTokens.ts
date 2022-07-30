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
  useOperation,
} from '@/types';
import { TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { isMint, Mint } from './Mint';
import { TokenProgram } from './program';
import { findAssociatedTokenAccountPda } from './pdas';

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
  toToken?: PublicKey; // Defaults to associated account.
  mintAuthority?: PublicKey | Signer; // Defaults to mx.identity().
  multiSigners?: KeypairSigner[]; // Defaults to [].
  tokenProgram?: PublicKey; // Defaults to Token Program.
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
      return mintTokensBuilder(metaplex, operation.input).sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      );
    },
  };

// -----------------
// Builder
// -----------------

export type MintTokensBuilderParams = Omit<
  MintTokensInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export const mintTokensBuilder = (
  metaplex: Metaplex,
  params: MintTokensBuilderParams
): TransactionBuilder => {
  const {
    mint,
    amount,
    toOwner = metaplex.identity().publicKey,
    toToken,
    mintAuthority = metaplex.identity(),
    multiSigners = [],
    tokenProgram = TokenProgram.publicKey,
  } = params;

  const [mintAuthorityPublicKey, signers] = isSigner(mintAuthority)
    ? [mintAuthority.publicKey, [mintAuthority]]
    : [mintAuthority, multiSigners];

  const mintAddress = isMint(mint) ? mint.address : mint;
  const destination =
    toToken ?? findAssociatedTokenAccountPda(mintAddress, toOwner);

  return TransactionBuilder.make().add({
    instruction: createMintToInstruction(
      mintAddress,
      destination,
      mintAuthorityPublicKey,
      amount.basisPoints.toNumber(),
      multiSigners,
      tokenProgram
    ),
    signers,
    key: params.instructionKey ?? 'mintTokens',
  });
};
