import {
  AuthorizationData,
  createTransferInstruction,
} from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '@/Metaplex';
import {
  Operation,
  OperationHandler,
  OperationScope,
  Signer,
  SplTokenAmount,
  token,
  useOperation,
} from '@/types';
import { TransactionBuilder, TransactionBuilderOptions } from '@/utils';

// -----------------
// Operation
// -----------------

const Key = 'TransferNftOperation' as const;

/**
 * Transfers an NFT or SFT from one account to another.
 *
 * ```ts
 * await metaplex.nfts().transfer({
 *   mintAddress,
 *   toOwner,
 *   amount: token(5),
 * });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const transferNftOperation = useOperation<TransferNftOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type TransferNftOperation = Operation<
  typeof Key,
  TransferNftInput,
  TransferNftOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type TransferNftInput = {
  /** The address of the mint account. */
  mintAddress: PublicKey;

  /**
   * The authority allowed to mint as a Signer.
   *
   * @defaultValue `metaplex.identity()`
   */
  authority?: Signer;

  /**
   * If the `authority` attribute is a delegate authority,
   * this attribute refers to the PDA of the delegate account.
   * It must be provided if the `authority` is a delegate.
   *
   * @defaultValue Defaults to not using a delegate.
   */
  delegateRecord?: PublicKey;

  /**
   * The optional address of the authorization rules to use.
   *
   * @defaultValue `undefined`
   */
  authorizationRules?: PublicKey;

  /**
   * The optional authorization payload to pass in.
   *
   * @defaultValue `null`
   */
  authorizationData?: AuthorizationData;

  /**
   * The wallet to get the tokens from.
   *
   * @defaultValue `authority.publicKey`
   */
  fromOwner?: PublicKey;

  /**
   * The wallet to send the tokens to.
   */
  toOwner: PublicKey;

  /**
   * The amount of tokens to mint.
   *
   * @defaultValue `token(1)`
   */
  amount?: SplTokenAmount;
};

/**
 * @group Operations
 * @category Outputs
 */
export type TransferNftOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const transferNftOperationHandler: OperationHandler<TransferNftOperation> =
  {
    handle: async (
      operation: TransferNftOperation,
      metaplex: Metaplex,
      scope: OperationScope
    ): Promise<TransferNftOutput> => {
      return transferNftBuilder(
        metaplex,
        operation.input,
        scope
      ).sendAndConfirm(metaplex, scope.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type TransferNftBuilderParams = Omit<
  TransferNftInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that uses the NFT. */
  instructionKey?: string;
};

/**
 * Transfers an NFT or SFT from one account to another.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .transfer({
 *     mintAddress,
 *     toOwner,
 *     amount: token(5),
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const transferNftBuilder = (
  metaplex: Metaplex,
  params: TransferNftBuilderParams,
  options: TransactionBuilderOptions = {}
): TransactionBuilder => {
  const { programs, payer = metaplex.rpc().getDefaultFeePayer() } = options;
  const {
    mintAddress,
    authority = metaplex.identity(),
    fromOwner = authority.publicKey,
    toOwner,
    amount = token(1),
    authorizationRules,
  } = params;

  // Programs.
  const tokenMetadataProgram = metaplex.programs().getTokenMetadata(programs);
  const ataProgram = metaplex.programs().getAssociatedToken(programs);
  const tokenProgram = metaplex.programs().getToken(programs);
  const systemProgram = metaplex.programs().getSystem(programs);

  // PDAs.
  const metadata = metaplex.nfts().pdas().metadata({
    mint: mintAddress,
    programs,
  });
  const masterEdition = metaplex.nfts().pdas().masterEdition({
    mint: mintAddress,
    programs,
  });
  const fromToken = metaplex.tokens().pdas().associatedTokenAccount({
    mint: mintAddress,
    owner: fromOwner,
    programs,
  });
  const toToken = metaplex.tokens().pdas().associatedTokenAccount({
    mint: mintAddress,
    owner: toOwner,
    programs,
  });

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Update the metadata account.
      .add({
        instruction: createTransferInstruction(
          {
            authority: authority.publicKey,
            delegateRecord: params.delegateRecord,
            token: fromToken,
            tokenOwner: fromOwner,
            destination: toToken,
            destinationOwner: toOwner,
            mint: mintAddress,
            metadata,
            masterEdition,
            splTokenProgram: tokenProgram.address,
            splAtaProgram: ataProgram.address,
            systemProgram: systemProgram.address,
            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            // authorizationRulesProgram?
            authorizationRules,
          },
          {
            transferArgs: {
              __kind: 'V1',
              amount: amount.basisPoints,
              authorizationData: params.authorizationData ?? null,
            },
          },
          tokenMetadataProgram.address
        ),
        signers: [payer, authority],
        key: params.instructionKey ?? 'transferNft',
      })
  );
};
