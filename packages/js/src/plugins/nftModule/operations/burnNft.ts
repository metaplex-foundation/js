import { createBurnInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import {
  getSignerFromTokenMetadataAuthority,
  parseTokenMetadataAuthorization,
  TokenMetadataAuthorityHolder,
  TokenMetadataAuthorityTokenDelegate,
  TokenMetadataAuthorizationDetails,
} from '../Authorization';
import { isNonFungible, isProgrammable, Sft } from '../models';
import { TransactionBuilder, TransactionBuilderOptions } from '@/utils';
import {
  Operation,
  OperationHandler,
  OperationScope,
  Signer,
  SplTokenAmount,
  token,
  useOperation,
} from '@/types';
import { Metaplex } from '@/Metaplex';

// -----------------
// Operation
// -----------------

const Key = 'BurnNftOperation' as const;

/**
 * Burns all accounts of an NFT or SFT.
 *
 * ```ts
 * await metaplex.nfts().burn({
 *   nftOrSft,
 * });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const burnNftOperation = useOperation<BurnNftOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type BurnNftOperation = Operation<
  typeof Key,
  BurnNftInput,
  BurnNftOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type BurnNftInput = {
  /**
   * The NFT or SFT to burn.
   * We only need its address and token standard.
   */
  nftOrSft: Pick<Sft, 'address' | 'tokenStandard'>;

  /**
   * An authority allowed to burn the asset.
   *
   * Note that Metadata authorities are
   * not supported for this instruction.
   *
   * If a `Signer` is provided directly,
   * it will be used as an Holder authority.
   *
   * @see {@link TokenMetadataAuthority}
   * @defaultValue `metaplex.identity()`
   */
  authority?:
    | Signer
    | TokenMetadataAuthorityTokenDelegate
    | TokenMetadataAuthorityHolder;

  /**
   * The authorization rules and data to use for the burn.
   *
   * @see {@link TokenMetadataAuthorizationDetails}
   * @defaultValue Defaults to not using auth rules.
   */
  authorizationDetails?: TokenMetadataAuthorizationDetails;

  /**
   * The wallet to get the tokens from.
   *
   * @defaultValue The public key of the provided authority.
   */
  owner?: PublicKey;

  /**
   * The token account to be debited.
   *
   * @defaultValue Defaults to the associated token account of `owner`.
   */
  token?: PublicKey;

  /**
   * The amount of tokens to burn.
   *
   * @defaultValue `token(1)`
   */
  amount?: SplTokenAmount;

  /** The metadata account of the collection this asset belongs to, if any. */
  collectionMetadata?: PublicKey;

  /** The mint account of the master edition of the asset, if it is a printed edition. */
  masterEditionMint?: PublicKey;

  /** The token account of the master edition of the asset, if it is a printed edition. */
  masterEditionToken?: PublicKey;

  /** The edition marker account that keeps track of this edition, if it is a printed edition */
  editionMarker?: PublicKey;
};

/**
 * @group Operations
 * @category Outputs
 */
export type BurnNftOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const burnNftOperationHandler: OperationHandler<BurnNftOperation> = {
  handle: async (
    operation: BurnNftOperation,
    metaplex: Metaplex,
    scope: OperationScope
  ): Promise<BurnNftOutput> => {
    return burnNftBuilder(metaplex, operation.input, scope).sendAndConfirm(
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
export type BurnNftBuilderParams = Omit<BurnNftInput, 'confirmOptions'> & {
  /** A key to distinguish the instruction that uses the NFT. */
  instructionKey?: string;
};

/**
 * Burns all accounts of an NFT or SFT.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .burn({
 *     nftOrSft,
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const burnNftBuilder = (
  metaplex: Metaplex,
  params: BurnNftBuilderParams,
  options: TransactionBuilderOptions = {}
): TransactionBuilder => {
  const { programs, payer = metaplex.rpc().getDefaultFeePayer() } = options;
  const {
    nftOrSft,
    authority = metaplex.identity(),
    amount = token(1),
    authorizationDetails,
  } = params;

  // From owner.
  const owner =
    params.owner ?? getSignerFromTokenMetadataAuthority(authority).publicKey;

  // Programs.
  const tokenMetadataProgram = metaplex.programs().getTokenMetadata(programs);
  const tokenProgram = metaplex.programs().getToken(programs);
  const systemProgram = metaplex.programs().getSystem(programs);

  // PDAs.
  const metadata = metaplex.nfts().pdas().metadata({
    mint: nftOrSft.address,
    programs,
  });
  const edition = metaplex.nfts().pdas().masterEdition({
    mint: nftOrSft.address,
    programs,
  });
  const tokenAccount =
    params.token ??
    metaplex.tokens().pdas().associatedTokenAccount({
      mint: nftOrSft.address,
      owner,
      programs,
    });
  const tokenRecord = metaplex.nfts().pdas().tokenRecord({
    mint: nftOrSft.address,
    token: tokenAccount,
    programs,
  });

  // Auth.
  const auth = parseTokenMetadataAuthorization(metaplex, {
    mint: nftOrSft.address,
    authority:
      '__kind' in authority
        ? authority
        : { __kind: 'holder', owner: authority, token: tokenAccount },
    authorizationDetails,
    programs,
  });

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Update the metadata account.
      .add({
        instruction: createBurnInstruction(
          {
            authority: auth.accounts.authority,
            collectionMetadata: params.collectionMetadata,
            metadata,
            edition: isNonFungible(nftOrSft) ? edition : undefined,
            mint: nftOrSft.address,
            token: tokenAccount,
            masterEditionMint: params.masterEditionMint,
            masterEdition: params.masterEditionMint
              ? metaplex.nfts().pdas().masterEdition({
                  mint: params.masterEditionMint,
                  programs,
                })
              : undefined,
            masterEditionToken: params.masterEditionToken,
            editionMarker: params.editionMarker,
            tokenRecord: isProgrammable(nftOrSft) ? tokenRecord : undefined,
            systemProgram: systemProgram.address,
            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            splTokenProgram: tokenProgram.address,
          },
          {
            burnArgs: {
              __kind: 'V1',
              amount: amount.basisPoints,
              ...auth.data,
            },
          },
          tokenMetadataProgram.address
        ),
        signers: [payer, ...auth.signers],
        key: params.instructionKey ?? 'burnNft',
      })
  );
};
