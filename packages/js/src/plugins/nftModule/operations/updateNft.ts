import {
  AuthorityType,
  createUpdateInstruction,
  ProgrammableConfig,
  TokenStandard,
  UpdateArgs,
  Uses,
} from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
import isEqual from 'lodash.isequal';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Sft } from '../models';
import { Option, TransactionBuilder, TransactionBuilderOptions } from '@/utils';
import {
  CreatorInput,
  Operation,
  OperationHandler,
  OperationScope,
  Signer,
  useOperation,
} from '@/types';
import { Metaplex } from '@/Metaplex';
import { NoInstructionsToSendError } from '@/errors';

// -----------------
// Operation
// -----------------

const Key = 'UpdateNftOperation' as const;

/**
 * Updates an existing NFT or SFT.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .update({ nftOrSft, name: "My new NFT name" });
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const updateNftOperation = useOperation<UpdateNftOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type UpdateNftOperation = Operation<
  typeof Key,
  UpdateNftInput,
  UpdateNftOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type UpdateNftInput = {
  /**
   * The NFT or SFT to update.
   * We only need a subset of the `Sft` (or `Nft`) model to figure out
   * the current values for the data of the metadata account and only update
   * the parts that are different.
   */
  nftOrSft: Pick<
    Sft,
    | 'address'
    | 'collection'
    | 'creators'
    | 'name'
    | 'symbol'
    | 'uri'
    | 'sellerFeeBasisPoints'
    | 'uses'
    | 'programmableConfig'
    | 'tokenStandard'
  >;

  /**
   * The current update authority of the asset as a Signer.
   *
   * @defaultValue `metaplex.identity()`
   */
  updateAuthority?: Signer;

  /**
   * The address of the new update authority to set for the asset
   *
   * @defaultValue Defaults to not being updated.
   */
  newUpdateAuthority?: PublicKey;

  /**
   * The new on-chain name of the asset.
   *
   * @defaultValue Defaults to not being updated.
   */
  name?: string;

  /**
   * The new on-chain symbol of the asset.
   *
   * @defaultValue Defaults to not being updated.
   */
  symbol?: string;

  /**
   * The new on-chain uri of the asset.
   *
   * @defaultValue Defaults to not being updated.
   */
  uri?: string;

  /**
   * The new royalties of the asset in percent basis point
   * (i.e. 250 is 2.5%) that should be paid to the creators
   * on each secondary sale.
   *
   * @defaultValue Defaults to not being updated.
   */
  sellerFeeBasisPoints?: number;

  /**
   * The new creators for the asset.
   * For each creator, if an `authority` Signer is provided,
   * the creator will be marked as verified.
   *
   * @defaultValue Defaults to not being updated.
   */
  creators?: CreatorInput[];

  /**
   * Whether or not the asset has already been sold to its first buyer.
   * This can only be flipped from `false` to `true`.
   *
   * @defaultValue Defaults to not being updated.
   */
  primarySaleHappened?: boolean;

  /**
   * Whether or not the asset is mutable.
   * When set to `false` no one can update the Metadata account,
   * not even the update authority.
   * This can only be flipped from `true` to `false`.
   *
   * @defaultValue Defaults to not being updated.
   */
  isMutable?: boolean;

  /**
   * When this field is not `null`, it indicates that the asset
   * can be "used" by its owner or any approved "use authorities".
   *
   * @defaultValue Defaults to not being updated.
   */
  uses?: Option<Uses>;

  /**
   * The new Collection NFT that this asset belongs to.
   * When `null`, this will remove the asset from its current collection.
   *
   * @defaultValue Defaults to not being updated.
   */
  collection?: Option<PublicKey>;

  /**
   * Programmable configuration for the asset.
   * This is only relevant for programmable NFTs, i.e. if the
   * `tokenStandard` is set to `TokenStandard.ProgrammableNonFungible`.
   *
   * @defaultValue Defaults to not being updated.
   */
  programmableConfig?: Option<ProgrammableConfig>;

  /**
   * The collection authority that should sign the asset
   * to prove that it is part of the newly provided collection.
   * When `null`, the provided `collection` will not be verified.
   *
   * @defaultValue `null`
   */
  collectionAuthority?: Option<Signer>;

  /**
   * Whether or not the provided `collectionAuthority` is a delegated
   * collection authority, i.e. it was approved by the update authority
   * using `metaplex.nfts().approveCollectionAuthority()`.
   *
   * @defaultValue `false`
   */
  collectionAuthorityIsDelegated?: boolean;

  /**
   * Whether or not the newly provided `collection` is a sized collection
   * and not a legacy collection.
   *
   * @defaultValue `true`
   */
  collectionIsSized?: boolean;

  /**
   * The authority of the asset's current collection.
   * This may be required if the current collection is being removed
   * or updated and needs to be unverified before doing so.
   *
   * @defaultValue `updateAuthority`
   */
  oldCollectionAuthority?: Signer;

  /**
   * Whether or not the asset's current collection is a sized collection
   * and not a legacy collection.
   *
   * @defaultValue `true`
   */
  oldCollectionIsSized?: boolean;
};

/**
 * @group Operations
 * @category Outputs
 */
export type UpdateNftOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const updateNftOperationHandler: OperationHandler<UpdateNftOperation> = {
  handle: async (
    operation: UpdateNftOperation,
    metaplex: Metaplex,
    scope: OperationScope
  ): Promise<UpdateNftOutput> => {
    const builder = updateNftBuilder(metaplex, operation.input, scope);

    if (builder.isEmpty()) {
      throw new NoInstructionsToSendError(Key);
    }

    return builder.sendAndConfirm(metaplex, scope.confirmOptions);
  },
};

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type UpdateNftBuilderParams = Omit<UpdateNftInput, 'confirmOptions'> & {
  /** A key to distinguish the instruction that updates the metadata account. */
  updateMetadataInstructionKey?: string;
};

/**
 * Updates an existing NFT or SFT.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .update({ nftOrSft, name: "My new NFT name" });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const updateNftBuilder = (
  metaplex: Metaplex,
  params: UpdateNftBuilderParams,
  options: TransactionBuilderOptions = {}
): TransactionBuilder => {
  const { programs, payer = metaplex.rpc().getDefaultFeePayer() } = options;
  const { nftOrSft, updateAuthority = metaplex.identity() } = params;

  // Programs.
  const tokenMetadataProgram = metaplex.programs().getTokenMetadata(programs);
  const systemProgram = metaplex.programs().getSystem(programs);

  const updateInstructionDataWithoutChanges = toInstructionData(nftOrSft);
  const updateInstructionData = toInstructionData(nftOrSft, params);
  const shouldSendUpdateInstruction = !isEqual(
    updateInstructionData,
    updateInstructionDataWithoutChanges
  );

  const isRemovingVerifiedCollection =
    !!nftOrSft.collection &&
    !!nftOrSft.collection.verified &&
    params.collection === null;
  const isOverridingVerifiedCollection =
    !!nftOrSft.collection &&
    !!nftOrSft.collection.verified &&
    !!params.collection &&
    !params.collection.equals(nftOrSft.collection.address);
  const shouldUnverifyCurrentCollection =
    isRemovingVerifiedCollection || isOverridingVerifiedCollection;

  const shouldPassEditionAccount =
    nftOrSft.tokenStandard === null ||
    nftOrSft.tokenStandard === TokenStandard.NonFungible ||
    nftOrSft.tokenStandard === TokenStandard.NonFungibleEdition ||
    nftOrSft.tokenStandard === TokenStandard.ProgrammableNonFungible;

  const creatorsInput: CreatorInput[] = params.creators ?? nftOrSft.creators;
  const verifyAdditionalCreatorInstructions = creatorsInput
    .filter((creator) => {
      const currentCreator = nftOrSft.creators.find(({ address }) =>
        address.equals(creator.address)
      );
      const currentlyVerified = currentCreator?.verified ?? false;
      return !!creator.authority && !currentlyVerified;
    })
    .map((creator) => {
      return metaplex.nfts().builders().verifyCreator(
        {
          mintAddress: nftOrSft.address,
          creator: creator.authority,
        },
        { payer, programs }
      );
    });

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Unverify current collection before overriding it.
      // Otherwise, the previous collection size will not be properly decremented.
      .when(shouldUnverifyCurrentCollection, (builder) =>
        builder.add(
          metaplex
            .nfts()
            .builders()
            .unverifyCollection(
              {
                mintAddress: nftOrSft.address,
                collectionMintAddress: nftOrSft.collection
                  ?.address as PublicKey,
                collectionAuthority:
                  params.oldCollectionAuthority ?? updateAuthority,
                isSizedCollection: params.oldCollectionIsSized ?? true,
              },
              { programs, payer }
            )
        )
      )

      // Update the metadata account.
      .when(shouldSendUpdateInstruction, (builder) =>
        builder.add({
          instruction: createUpdateInstruction(
            {
              authority: updateAuthority.publicKey,
              metadata: metaplex.nfts().pdas().metadata({
                mint: nftOrSft.address,
                programs,
              }),
              edition: shouldPassEditionAccount
                ? metaplex.nfts().pdas().masterEdition({
                    mint: nftOrSft.address,
                    programs,
                  })
                : undefined,
              mint: nftOrSft.address,
              systemProgram: systemProgram.address,
              sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
              // TODO: token: PublicKey,
              // TODO: delegateRecord: PublicKey,
              // authorizationRulesProgram,
              // TODO: authorizationRules: PublicKey,
            },
            { updateArgs: updateInstructionData },
            tokenMetadataProgram.address
          ),
          signers: [updateAuthority],
          key: params.updateMetadataInstructionKey ?? 'updateMetadata',
        })
      )

      // Verify additional creators.
      .add(...verifyAdditionalCreatorInstructions)

      // Verify collection.
      .when(!!params.collection && !!params.collectionAuthority, (builder) =>
        builder.add(
          metaplex
            .nfts()
            .builders()
            .verifyCollection(
              {
                mintAddress: nftOrSft.address,
                collectionMintAddress: params.collection as PublicKey,
                collectionAuthority: params.collectionAuthority as Signer,
                isDelegated: params.collectionAuthorityIsDelegated ?? false,
                isSizedCollection: params.collectionIsSized ?? true,
              },
              { programs, payer }
            )
        )
      )
  );
};

const toInstructionData = (
  nftOrSft: Pick<
    Sft,
    | 'address'
    | 'collection'
    | 'creators'
    | 'name'
    | 'symbol'
    | 'uri'
    | 'sellerFeeBasisPoints'
    | 'uses'
    | 'programmableConfig'
  >,
  input: Partial<UpdateNftInput> = {}
): UpdateArgs => {
  const creators =
    input.creators === undefined
      ? nftOrSft.creators
      : input.creators.map((creator) => {
          const currentCreator = nftOrSft.creators.find(({ address }) =>
            address.equals(creator.address)
          );
          return {
            ...creator,
            verified: currentCreator?.verified ?? false,
          };
        });

  return {
    __kind: 'V1',
    newUpdateAuthority: input.newUpdateAuthority ?? null,
    data: {
      name: input.name ?? nftOrSft.name,
      symbol: input.symbol ?? nftOrSft.symbol,
      uri: input.uri ?? nftOrSft.uri,
      sellerFeeBasisPoints:
        input.sellerFeeBasisPoints ?? nftOrSft.sellerFeeBasisPoints,
      creators: creators.length > 0 ? creators : null,
    },
    primarySaleHappened: input.primarySaleHappened ?? null,
    isMutable: input.isMutable ?? null,
    collection: input.collection
      ? { __kind: 'Set', fields: [{ key: input.collection, verified: false }] }
      : { __kind: input.collection === undefined ? 'None' : 'Clear' },
    collectionDetails: { __kind: 'None' }, // TODO: Ask for collectionDetails? They can already use `migrateToSizedCollection`.
    uses: input.uses
      ? { __kind: 'Set', fields: [input.uses] }
      : { __kind: input.uses === undefined ? 'None' : 'Clear' },
    programmableConfig: input.programmableConfig
      ? { __kind: 'Set', fields: [input.programmableConfig] }
      : { __kind: input.programmableConfig === undefined ? 'None' : 'Clear' },

    // These are not fields to update on the asset.
    // Instead they are authorization input related to the provided authority.
    // It tells the program how to authorize the update.
    authorityType: AuthorityType.Metadata, // TODO: Custom AuthorityType
    authorizationData: null, // TODO: Option<AuthorizationData>
  };
};
