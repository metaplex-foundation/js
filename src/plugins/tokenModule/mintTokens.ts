import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { createMintToInstruction } from '@solana/spl-token';
import type { Metaplex } from '@/Metaplex';
import {
  Amount,
  isSigner,
  KeypairSigner,
  Operation,
  OperationHandler,
  Signer,
  useOperation,
} from '@/types';
import { TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { isMint, Mint } from './Mint';
import { TokenProgram } from './program';

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
  destination: PublicKey;
  amount: Amount;
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
    destination,
    amount,
    mintAuthority = metaplex.identity(),
    multiSigners = [],
    tokenProgram = TokenProgram.publicKey,
  } = params;

  const [mintAuthorityPublicKey, signers] = isSigner(mintAuthority)
    ? [mintAuthority.publicKey, [mintAuthority]]
    : [mintAuthority, multiSigners];

  return TransactionBuilder.make().add({
    instruction: createMintToInstruction(
      isMint(mint) ? mint.address : mint,
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
