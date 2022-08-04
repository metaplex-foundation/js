import { ExpectedSignerError } from '@/errors';
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
  const destinationAddress = toPublicKey(destination);
  const destinationAccount = await metaplex
    .rpc()
    .getAccount(destinationAddress);

  const builder = TransactionBuilder.make();

  // Create token account if it does not exist.
  if (!destinationAccount.exists) {
    if (toToken && !isSigner(toToken)) {
      throw new ExpectedSignerError('toToken', 'PublicKey', {
        problemSuffix:
          `The provided "toToken" account does not exist. ` +
          `Therefore, it needs to be created and passed as a Signer.`,
        solution:
          `If you want to create the "toToken" account, then please pass it as a Signer. ` +
          `Alternatively, you can pass the "toOwner" account as a PublicKey instead to ` +
          `use or create an associated token account.`,
      });
    }

    builder.add(
      await metaplex
        .tokens()
        .builders()
        .createToken({
          ...params,
          mint: mintAddress,
          owner: toOwner,
          token: toToken,
          payer,
        })
    );
  }

  // Transfer tokens.
  return builder.add({
    instruction: createTransferCheckedInstruction(
      source,
      mintAddress,
      destinationAddress,
      fromOwnerPublicKey,
      amount.basisPoints.toNumber(),
      decimals,
      fromMultiSigners,
      tokenProgram
    ),
    signers,
    key: params.transferTokensInstructionKey ?? 'transferTokens',
  });
};
