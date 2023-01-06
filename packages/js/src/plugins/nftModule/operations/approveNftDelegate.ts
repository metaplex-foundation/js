import {
  createDelegateInstruction,
  DelegateArgs,
} from '@metaplex-foundation/mpl-token-metadata';
import { SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import {
  parseTokenMetadataAuthorization,
  TokenMetadataAuthorityHolder,
  TokenMetadataAuthorityMetadata,
  TokenMetadataAuthorizationDetails,
} from '../Authorization';
import {
  DelegateInput,
  parseTokenMetadataDelegateInput,
} from '../DelegateInput';
import { isNonFungible, Sft } from '../models';
import { TransactionBuilder, TransactionBuilderOptions } from '@/utils';
import {
  Operation,
  OperationHandler,
  OperationScope,
  Signer,
  useOperation,
} from '@/types';
import { Metaplex } from '@/Metaplex';

// -----------------
// Operation
// -----------------

const Key = 'ApproveNftDelegateOperation' as const;

/**
 * Approve a new delegate authority for an NFT or SFT.
 *
 * ```ts
 * await metaplex.nfts().delegate({
 *   nftOrSft,
 *   delegate,
 *   delegateArgs
 * });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const approveNftDelegateOperation =
  useOperation<ApproveNftDelegateOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type ApproveNftDelegateOperation = Operation<
  typeof Key,
  ApproveNftDelegateInput,
  ApproveNftDelegateOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type ApproveNftDelegateInput = {
  /**
   * The NFT or SFT to mint from.
   * We only need its address and token standard.
   */
  nftOrSft: Pick<Sft, 'address' | 'tokenStandard'>;

  /**
   * An authority allowed to approve a new delegate authority.
   *
   * Note that Delegate authorities are not supported for this
   * instruction as delegates cannot approve other delegates.
   *
   * If a `Signer` is provided directly,
   * it will be used as the update authority.
   *
   * @see {@link TokenMetadataAuthority}
   * @defaultValue `metaplex.identity()`
   */
  authority?:
    | Signer
    | TokenMetadataAuthorityMetadata
    | TokenMetadataAuthorityHolder;

  /**
   * The authorization rules and data to use for the mint.
   *
   * @see {@link TokenMetadataAuthorizationDetails}
   * @defaultValue Defaults to not using auth rules.
   */
  authorizationDetails?: TokenMetadataAuthorizationDetails;

  /**
   * The role, address and namespace of the delegate to approve.
   */
  delegate: DelegateInput & {
    data: DelegateArgs;
  };
};

/**
 * @group Operations
 * @category Outputs
 */
export type ApproveNftDelegateOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const approveNftDelegateOperationHandler: OperationHandler<ApproveNftDelegateOperation> =
  {
    handle: async (
      operation: ApproveNftDelegateOperation,
      metaplex: Metaplex,
      scope: OperationScope
    ): Promise<ApproveNftDelegateOutput> => {
      return approveNftDelegateBuilder(
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
export type ApproveNftDelegateBuilderParams = Omit<
  ApproveNftDelegateInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that uses the NFT. */
  instructionKey?: string;
};

/**
 * Approve a new delegate authority for an NFT or SFT.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .delegate({
 *     nftOrSft,
 *     delegate,
 *     delegateArgs
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const approveNftDelegateBuilder = (
  metaplex: Metaplex,
  params: ApproveNftDelegateBuilderParams,
  options: TransactionBuilderOptions = {}
): TransactionBuilder => {
  const { programs, payer = metaplex.rpc().getDefaultFeePayer() } = options;
  const {
    nftOrSft,
    authority = metaplex.identity(),
    authorizationDetails,
  } = params;

  // Programs.
  const tokenMetadataProgram = metaplex.programs().getTokenMetadata(programs);
  const tokenProgram = metaplex.programs().getToken(programs);
  const systemProgram = metaplex.programs().getSystem(programs);

  // PDAs.
  const metadata = metaplex.nfts().pdas().metadata({
    mint: nftOrSft.address,
    programs,
  });
  const masterEdition = metaplex.nfts().pdas().masterEdition({
    mint: nftOrSft.address,
    programs,
  });

  // New Delegate.
  const { delegateRecord, delegate, namespace } =
    parseTokenMetadataDelegateInput(
      metaplex,
      nftOrSft.address,
      params.delegate,
      programs
    );

  // Auth.
  const auth = parseTokenMetadataAuthorization(metaplex, {
    mint: nftOrSft.address,
    authority:
      '__kind' in authority
        ? authority
        : { __kind: 'metadata', updateAuthority: authority },
    authorizationDetails,
    programs,
  });

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Update the metadata account.
      .add({
        instruction: createDelegateInstruction(
          {
            ...auth.accounts,
            delegateRecord,
            delegate,
            metadata,
            masterEdition: isNonFungible(nftOrSft) ? masterEdition : undefined,
            mint: nftOrSft.address,
            namespace,
            payer: payer.publicKey,
            systemProgram: systemProgram.address,
            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            splTokenProgram: tokenProgram.address,
            // authorizationRulesProgram,
          },
          { delegateArgs: params.delegate.data },
          tokenMetadataProgram.address
        ),
        signers: [payer],
        key: params.instructionKey ?? 'approveNftDelegate',
      })
  );
};
