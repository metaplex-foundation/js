import {
  AuthorizationData,
  createMintInstruction,
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

const Key = 'MintNftOperation' as const;

/**
 * Mint token(s) for an NFT or SFT.
 *
 * ```ts
 * await metaplex.nfts().mint({
 *   mintAddress,
 *   toOwner,
 *   amount: token(5),
 * });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const mintNftOperation = useOperation<MintNftOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type MintNftOperation = Operation<
  typeof Key,
  MintNftInput,
  MintNftOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type MintNftInput = {
  /** The address of the mint account. */
  mintAddress: PublicKey;

  /**
   * The owner of the destination token account.
   *
   * @defaultValue `metaplex.identity().publicKey`
   */
  toOwner?: PublicKey;

  /**
   * The address of the destination token account.
   *
   * This may be a regular token account or an associated token account.
   * If the token account does not exist, then it will be created but
   * only if it is an associated token account.
   *
   * @defaultValue Defaults to using the associated token account
   * from the `mintAddress` and `toOwner` parameters.
   */
  toToken?: PublicKey;

  /**
   * The amount of tokens to mint.
   *
   * @defaultValue `token(1)`
   */
  amount?: SplTokenAmount;

  /**
   * The authority allowed to mint as a Signer.
   *
   * @defaultValue `metaplex.identity()`
   */
  authority?: Signer;

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
};

/**
 * @group Operations
 * @category Outputs
 */
export type MintNftOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const mintNftOperationHandler: OperationHandler<MintNftOperation> = {
  handle: async (
    operation: MintNftOperation,
    metaplex: Metaplex,
    scope: OperationScope
  ): Promise<MintNftOutput> => {
    return mintNftBuilder(metaplex, operation.input, scope).sendAndConfirm(
      metaplex,
      scope.confirmOptions
    );
  },
};

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type MintNftBuilderParams = Omit<MintNftInput, 'confirmOptions'> & {
  /** A key to distinguish the instruction that uses the NFT. */
  instructionKey?: string;
};

/**
 * Mint token(s) for an NFT or SFT.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .mint({
 *     mintAddress,
 *     toOwner,
 *     amount: token(5),
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const mintNftBuilder = (
  metaplex: Metaplex,
  params: MintNftBuilderParams,
  options: TransactionBuilderOptions = {}
): TransactionBuilder => {
  const { programs, payer = metaplex.rpc().getDefaultFeePayer() } = options;
  const {
    mintAddress,
    authority = metaplex.identity(),
    toOwner = metaplex.identity().publicKey,
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

  // Destination token account.
  const toToken =
    params.toToken ??
    metaplex.tokens().pdas().associatedTokenAccount({
      mint: mintAddress,
      owner: toOwner,
      programs,
    });

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Update the metadata account.
      .add({
        instruction: createMintInstruction(
          {
            token: toToken,
            metadata,
            masterEdition,
            mint: mintAddress,
            payer: payer.publicKey,
            authority: authority.publicKey,
            systemProgram: systemProgram.address,
            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            splTokenProgram: tokenProgram.address,
            splAtaProgram: ataProgram.address,
            // authorizationRulesProgram?
            authorizationRules,
          },
          {
            mintArgs: {
              __kind: 'V1',
              amount: amount.basisPoints,
              authorizationData: params.authorizationData ?? null,
            },
          },
          tokenMetadataProgram.address
        ),
        signers: [payer, authority],
        key: params.instructionKey ?? 'mintNft',
      })
  );
};
