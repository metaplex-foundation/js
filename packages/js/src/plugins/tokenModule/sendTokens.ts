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
import { createTransferCheckedInstruction } from '@solana/spl-token';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { isMint, Mint } from './Mint';
import { findAssociatedTokenAccountPda } from './pdas';
import { TokenProgram } from './program';
import type { TokenClient } from './TokenClient';
import type { TokenBuildersClient } from './TokenBuildersClient';

// -----------------
// Clients
// -----------------

/** @internal */
export function _sendTokensClient(this: TokenClient, input: SendTokensInput) {
  return this.metaplex.operations().getTask(sendTokensOperation(input));
}

/** @internal */
export function _sendTokensBuildersClient(
  this: TokenBuildersClient,
  input: SendTokensBuilderParams
) {
  return sendTokensBuilder(this.metaplex, input);
}

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
  amount: SplTokenAmount;
  toOwner?: PublicKey; // Defaults to mx.identity().
  toToken?: PublicKey | Signer; // If provided and token does not exist, it will create that account for you, hence the need for a Signer. Defaults to associated account.
  fromOwner?: PublicKey | Signer; // Defaults to mx.identity().
  fromToken?: PublicKey; // Defaults to associated account.
  fromMultiSigners?: KeypairSigner[]; // Defaults to [].
  payer?: Signer; // Only used to create missing token accounts. Defaults to mx.identity().
  tokenProgram?: PublicKey; // Defaults to Token Program.
  associatedTokenProgram?: PublicKey; // Defaults to Associated Token Program.
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
      const builder = await sendTokensBuilder(metaplex, operation.input);
      return builder.sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

export type SendTokensBuilderParams = Omit<
  SendTokensInput,
  'confirmOptions'
> & {
  toTokenExists?: boolean; // Defaults to false.
  createAssociatedTokenAccountInstructionKey?: string;
  createAccountInstructionKey?: string;
  initializeTokenInstructionKey?: string;
  transferTokensInstructionKey?: string;
};

export const sendTokensBuilder = async (
  metaplex: Metaplex,
  params: SendTokensBuilderParams
): Promise<TransactionBuilder> => {
  const {
    mint,
    amount,
    toOwner = metaplex.identity().publicKey,
    toToken,
    fromOwner = metaplex.identity(),
    fromToken,
    fromMultiSigners = [],
    payer = metaplex.identity(),
    tokenProgram = TokenProgram.publicKey,
  } = params;

  const [fromOwnerPublicKey, signers] = isSigner(fromOwner)
    ? [fromOwner.publicKey, [fromOwner]]
    : [fromOwner, fromMultiSigners];

  const mintAddress = isMint(mint) ? mint.address : mint;
  const decimals = isMint(mint) ? mint.decimals : amount.currency.decimals;
  const source =
    fromToken ?? findAssociatedTokenAccountPda(mintAddress, fromOwnerPublicKey);
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

      // Transfer tokens.
      .add({
        instruction: createTransferCheckedInstruction(
          source,
          mintAddress,
          toPublicKey(destination),
          fromOwnerPublicKey,
          amount.basisPoints.toNumber(),
          decimals,
          fromMultiSigners,
          tokenProgram
        ),
        signers,
        key: params.transferTokensInstructionKey ?? 'transferTokens',
      })
  );
};
