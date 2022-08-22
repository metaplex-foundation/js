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
 * Mint tokens to an account.
 *
 * ```ts
 * await metaplex
 *   .tokens()
 *   .mint({
 *     mintAddress,
 *     toOwner,
 *     amount: token(100),
 *   })
 *   .run();
 * ```
 *
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
  /** The address of the mint account. */
  mintAddress: PublicKey;

  /** The amount of tokens to mint. */
  amount: SplTokenAmount;

  /**
   * The owner of the token account to mint to.
   *
   * @defaultValue `metaplex.identity().publicKey`
   */
  toOwner?: PublicKey;

  /**
   * The address of the token account to mint to.
   *
   * Note that this may be required as a `Signer` if the destination
   * token account does not exist and we need to create it before
   * minting the tokens.
   *
   * @defaultValue Defaults to using the associated token account
   * from the `mintAddress` and `toOwner` parameters.
   */
  toToken?: PublicKey | Signer;

  /**
   * The authority that is allowed to mint new tokens as a Signer.
   *
   * This may be provided as a PublicKey if and only if
   * the `multiSigners` parameter is provided.
   *
   * @defaultValue `metaplex.identity()`
   */
  mintAuthority?: PublicKey | Signer;

  /**
   * The signing accounts to use if the mint authority is a multisig.
   *
   * @defaultValue `[]`
   */
  multiSigners?: KeypairSigner[];

  /**
   * The Signer paying for the new token account if it does not
   * already exist. This is also used to pay for the transaction fee.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /** The address of the SPL Token program to override if necessary. */
  tokenProgram?: PublicKey;

  /** The address of the SPL Associated Token program to override if necessary. */
  associatedTokenProgram?: PublicKey;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type MintTokensOutput = {
  /** The blockchain response from sending and confirming the transaction. */
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
   *
   * @defaultValue `true`
   */
  toTokenExists?: boolean;

  /** A key to distinguish the instruction that creates the associated token account. */
  createAssociatedTokenAccountInstructionKey?: string;

  /** A key to distinguish the instruction that creates the token account. */
  createAccountInstructionKey?: string;

  /** A key to distinguish the instruction that initializes the token account. */
  initializeTokenInstructionKey?: string;

  /** A key to distinguish the instruction that mints tokens. */
  mintTokensInstructionKey?: string;
};

/**
 * Mint tokens to an account.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .tokens()
 *   .builders()
 *   .mint({
 *     mintAddress,
 *     toOwner,
 *     amount: token(100),
 *   });
 * ```
 *
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
