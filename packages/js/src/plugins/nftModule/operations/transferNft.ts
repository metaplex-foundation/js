import { createTransferInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import {
  parseTokenMetadataAuthorization,
  TokenMetadataAuthorityDelegate,
  TokenMetadataAuthorityHolder,
  TokenMetadataAuthorizationDetails,
} from '../Authorization';
import { isNonFungible, Sft } from '../models';
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

const Key = 'TransferNftOperation' as const;

/**
 * Transfers an NFT or SFT from one account to another.
 *
 * ```ts
 * await metaplex.nfts().transfer({
 *   nftOrSft,
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
  /**
   * The NFT or SFT to transfer.
   * We only need its address and token standard.
   */
  nftOrSft: Pick<Sft, 'address' | 'tokenStandard'>;

  /**
   * An authority allowed to transfer the asset.
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
    | TokenMetadataAuthorityDelegate
    | TokenMetadataAuthorityHolder;

  /**
   * The authorization rules and data to use for the transfer.
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
 *     nftOrSft,
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
    nftOrSft,
    authority = metaplex.identity(),
    toOwner,
    amount = token(1),
    authorizationDetails,
  } = params;

  // From owner.
  const defaultFromOwner =
    '__kind' in authority ? authority.authority.publicKey : authority.publicKey;
  const fromOwner = params.fromOwner ?? defaultFromOwner;

  // Programs.
  const tokenMetadataProgram = metaplex.programs().getTokenMetadata(programs);
  const ataProgram = metaplex.programs().getAssociatedToken(programs);
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
  const fromToken = metaplex.tokens().pdas().associatedTokenAccount({
    mint: nftOrSft.address,
    owner: fromOwner,
    programs,
  });
  const toToken = metaplex.tokens().pdas().associatedTokenAccount({
    mint: nftOrSft.address,
    owner: toOwner,
    programs,
  });
  const delegateRecord = metaplex.nfts().pdas().persistentDelegateRecord({
    mint: nftOrSft.address,
    owner: fromToken,
    programs,
  });

  // Auth.
  const auth = parseTokenMetadataAuthorization({
    authority:
      '__kind' in authority
        ? authority
        : { __kind: 'holder', authority, token: fromToken },
    authorizationDetails,
  });

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Update the metadata account.
      .add({
        instruction: createTransferInstruction(
          {
            ...auth.accounts,
            delegateRecord,
            token: fromToken,
            tokenOwner: fromOwner,
            destination: toToken,
            destinationOwner: toOwner,
            mint: nftOrSft.address,
            metadata,
            edition: isNonFungible(nftOrSft) ? edition : undefined,
            payer: payer.publicKey,
            splTokenProgram: tokenProgram.address,
            splAtaProgram: ataProgram.address,
            systemProgram: systemProgram.address,
            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            // authorizationRulesProgram,
          },
          {
            transferArgs: {
              __kind: 'V1',
              amount: amount.basisPoints,
              ...auth.data,
            },
          },
          tokenMetadataProgram.address
        ),
        signers: [payer, ...auth.signers],
        key: params.instructionKey ?? 'transferNft',
      })
  );
};
