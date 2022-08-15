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
import { DisposableScope, TransactionBuilder } from '@/utils';
import { createTransferInstruction } from '@solana/spl-token';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findAssociatedTokenAccountPda } from '../pdas';
import { TokenProgram } from '../program';

// -----------------
// Operation
// -----------------

const Key = 'SendTokensOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const sendTokensOperation = useOperation<SendTokensOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type SendTokensOperation = Operation<
  typeof Key,
  SendTokensInput,
  SendTokensOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type SendTokensInput = {
  mintAddress: PublicKey;
  amount: SplTokenAmount;
  toOwner?: PublicKey; // Defaults to mx.identity().
  toToken?: PublicKey | Signer; // If provided and token does not exist, it will create that account for you, hence the need for a Signer. Defaults to associated account.
  fromOwner?: PublicKey | Signer; // Defaults to mx.identity().
  fromToken?: PublicKey; // Defaults to associated account.
  fromMultiSigners?: KeypairSigner[]; // Defaults to [].
  delegateAuthority?: Signer; // Defaults to not using a delegate authority.
  payer?: Signer; // Only used to create missing token accounts. Defaults to mx.identity().
  tokenProgram?: PublicKey; // Defaults to Token Program.
  associatedTokenProgram?: PublicKey; // Defaults to Associated Token Program.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type SendTokensOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const sendTokensOperationHandler: OperationHandler<SendTokensOperation> =
  {
    async handle(
      operation: SendTokensOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<SendTokensOutput> {
      const {
        mintAddress,
        toOwner = metaplex.identity().publicKey,
        toToken,
      } = operation.input;

      const destination =
        toToken ?? findAssociatedTokenAccountPda(mintAddress, toOwner);
      const destinationAddress = toPublicKey(destination);
      const destinationAccountExists = await metaplex
        .rpc()
        .accountExists(destinationAddress);
      scope.throwIfCanceled();

      const builder = await sendTokensBuilder(metaplex, {
        ...operation.input,
        toTokenExists: destinationAccountExists,
      });
      scope.throwIfCanceled();

      return builder.sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type SendTokensBuilderParams = Omit<
  SendTokensInput,
  'confirmOptions'
> & {
  toTokenExists?: boolean; // Defaults to true.
  createAssociatedTokenAccountInstructionKey?: string;
  createAccountInstructionKey?: string;
  initializeTokenInstructionKey?: string;
  transferTokensInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const sendTokensBuilder = async (
  metaplex: Metaplex,
  params: SendTokensBuilderParams
): Promise<TransactionBuilder> => {
  const {
    mintAddress,
    amount,
    toOwner = metaplex.identity().publicKey,
    toToken,
    toTokenExists = true,
    fromOwner = metaplex.identity(),
    fromToken,
    fromMultiSigners = [],
    delegateAuthority,
    payer = metaplex.identity(),
    tokenProgram = TokenProgram.publicKey,
  } = params;

  const [fromOwnerPublicKey, signers] = isSigner(fromOwner)
    ? [fromOwner.publicKey, [fromOwner]]
    : [fromOwner, [delegateAuthority, ...fromMultiSigners].filter(isSigner)];

  const source =
    fromToken ?? findAssociatedTokenAccountPda(mintAddress, fromOwnerPublicKey);
  const destination =
    toToken ?? findAssociatedTokenAccountPda(mintAddress, toOwner);

  return (
    TransactionBuilder.make()

      // Create token account if missing.
      .add(
        await metaplex
          .tokens()
          .builders()
          .createTokenIfMissing({
            ...params,
            mint: mintAddress,
            owner: toOwner,
            token: toToken,
            tokenExists: toTokenExists,
            payer,
            tokenVariable: 'toToken',
          })
      )

      // Transfer tokens.
      .add({
        instruction: createTransferInstruction(
          source,
          toPublicKey(destination),
          delegateAuthority ? delegateAuthority.publicKey : fromOwnerPublicKey,
          amount.basisPoints.toNumber(),
          fromMultiSigners,
          tokenProgram
        ),
        signers,
        key: params.transferTokensInstructionKey ?? 'transferTokens',
      })
  );
};
