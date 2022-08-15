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
import { createMintToInstruction } from '@solana/spl-token';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findAssociatedTokenAccountPda } from '../pdas';
import { TokenProgram } from '../program';

// -----------------
// Operation
// -----------------

const Key = 'MintTokensOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const mintTokensOperation = useOperation<MintTokensOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type MintTokensOperation = Operation<
  typeof Key,
  MintTokensInput,
  MintTokensOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type MintTokensInput = {
  mintAddress: PublicKey;
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

/**
 * @group Operations
 * @category Outputs
 */
export type MintTokensOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const mintTokensOperationHandler: OperationHandler<MintTokensOperation> =
  {
    async handle(
      operation: MintTokensOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<MintTokensOutput> {
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

      const builder = await mintTokensBuilder(metaplex, {
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
export type MintTokensBuilderParams = Omit<
  MintTokensInput,
  'confirmOptions'
> & {
  /**
   * Whether or not the provided token account already exists.
   * If `false`, we'll add another instruction to create it.
   * @defaultValue `true`
   */
  toTokenExists?: boolean;
  createAssociatedTokenAccountInstructionKey?: string;
  createAccountInstructionKey?: string;
  initializeTokenInstructionKey?: string;
  mintTokensInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const mintTokensBuilder = async (
  metaplex: Metaplex,
  params: MintTokensBuilderParams
): Promise<TransactionBuilder> => {
  const {
    mintAddress,
    amount,
    toOwner = metaplex.identity().publicKey,
    toToken,
    toTokenExists = true,
    mintAuthority = metaplex.identity(),
    multiSigners = [],
    payer = metaplex.identity(),
    tokenProgram = TokenProgram.publicKey,
  } = params;

  const [mintAuthorityPublicKey, signers] = isSigner(mintAuthority)
    ? [mintAuthority.publicKey, [mintAuthority]]
    : [mintAuthority, multiSigners];

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
