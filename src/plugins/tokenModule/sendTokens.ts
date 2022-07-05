import { ConfirmOptions, PublicKey } from '@solana/web3.js';
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
import { createTransferCheckedInstruction } from '@solana/spl-token';
import { isMint, Mint } from './Mint';
import { findAssociatedTokenAccountPda } from './pdas';
import { TokenProgram } from './program';

// -----------------
// Operation
// -----------------

const Key = 'SendTokensOperation' as const;
export const sendTokensOperation = useOperation<SendTokensOperation>(Key);
export type SendTokensOperation = Operation<
  typeof Key,
  SendTokensInput,
  SendTokensOutput
>;

export type SendTokensInput = {
  mint: PublicKey | Mint;
  to: PublicKey;
  amount: Amount;
  fromOwner?: PublicKey | Signer; // Defaults to mx.identity().
  fromToken?: PublicKey; // Defaults to associated account.
  fromMultiSigners?: KeypairSigner[]; // Defaults to [].
  tokenProgram?: PublicKey; // Defaults to Token Program.
  confirmOptions?: ConfirmOptions;
};

export type SendTokensOutput = {
  response: SendAndConfirmTransactionResponse;
};

// -----------------
// Handler
// -----------------

export const sendTokensOperationHandler: OperationHandler<SendTokensOperation> =
  {
    async handle(
      operation: SendTokensOperation,
      metaplex: Metaplex
    ): Promise<SendTokensOutput> {
      return sendTokensBuilder(metaplex, operation.input).sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      );
    },
  };

// -----------------
// Builder
// -----------------

export type SendTokensBuilderParams = Omit<
  SendTokensInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export const sendTokensBuilder = (
  metaplex: Metaplex,
  params: SendTokensBuilderParams
): TransactionBuilder => {
  const {
    mint,
    to,
    amount,
    fromOwner = metaplex.identity(),
    fromToken,
    fromMultiSigners = [],
    tokenProgram = TokenProgram.publicKey,
  } = params;

  const [fromOwnerPublicKey, signers] = isSigner(fromOwner)
    ? [fromOwner.publicKey, [fromOwner]]
    : [fromOwner, fromMultiSigners];

  const mintAddress = isMint(mint) ? mint.address : mint;
  const decimals = isMint(mint) ? mint.decimals : amount.currency.decimals;
  const fromTokenOrAssociated =
    fromToken ?? findAssociatedTokenAccountPda(mintAddress, fromOwnerPublicKey);

  return TransactionBuilder.make().add({
    instruction: createTransferCheckedInstruction(
      fromTokenOrAssociated,
      mintAddress,
      to,
      fromOwnerPublicKey,
      amount.basisPoints.toNumber(),
      decimals,
      fromMultiSigners,
      tokenProgram
    ),
    signers,
    key: params.instructionKey ?? 'transferTokens',
  });
};
