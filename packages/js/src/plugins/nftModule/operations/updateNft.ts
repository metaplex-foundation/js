import { NoInstructionsToSendError } from '@/errors';
import { Metaplex } from '@/Metaplex';
import {
  CreatorInput,
  Operation,
  OperationHandler,
  Signer,
  useOperation,
} from '@/types';
import { Option, TransactionBuilder } from '@/utils';
import {
  createUpdateMetadataAccountV2Instruction,
  UpdateMetadataAccountArgsV2,
  Uses,
} from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import isEqual from 'lodash.isequal';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Sft } from '../models';
import { findMetadataPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'UpdateNftOperation' as const;

/**
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
  // Accounts and models.
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
  >;
  updateAuthority?: Signer; // Defaults to mx.identity().
  newUpdateAuthority?: PublicKey;

  // Data.
  name?: string;
  symbol?: string;
  uri?: string;
  sellerFeeBasisPoints?: number;
  creators?: CreatorInput[];
  primarySaleHappened?: boolean;
  isMutable?: boolean;
  uses?: Option<Uses>;
  collection?: Option<PublicKey>;
  collectionAuthority?: Option<Signer>;
  collectionAuthorityIsDelegated?: boolean; // Defaults to false.
  collectionIsSized?: boolean; // Defaults to true.
  oldCollectionIsSized?: boolean; // Defaults to true.

  // Options.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type UpdateNftOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const updateNftOperationHandler: OperationHandler<UpdateNftOperation> = {
  handle: async (
    operation: UpdateNftOperation,
    metaplex: Metaplex
  ): Promise<UpdateNftOutput> => {
    const builder = updateNftBuilder(metaplex, operation.input);

    if (builder.isEmpty()) {
      throw new NoInstructionsToSendError(Key);
    }

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
export type UpdateNftBuilderParams = Omit<UpdateNftInput, 'confirmOptions'> & {
  updateMetadataInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
export const updateNftBuilder = (
  metaplex: Metaplex,
  params: UpdateNftBuilderParams
): TransactionBuilder => {
  const { nftOrSft, updateAuthority = metaplex.identity() } = params;
  const updateInstructionDataWithoutChanges = toInstructionData(nftOrSft);
  const updateInstructionData = toInstructionData(nftOrSft, params);
  const shouldSendUpdateInstruction = !isEqual(
    updateInstructionData,
    updateInstructionDataWithoutChanges
  );

  const isRemovingVerifiedCollection =
    !!nftOrSft.collection &&
    !!nftOrSft.collection.verified &&
    !params.collection;
  const isOverridingVerifiedCollection =
    !!nftOrSft.collection &&
    !!nftOrSft.collection.verified &&
    !!params.collection &&
    !params.collection.equals(nftOrSft.collection.address);
  const shouldUnverifyCurrentCollection =
    isRemovingVerifiedCollection || isOverridingVerifiedCollection;

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
      return metaplex.nfts().builders().verifyCreator({
        mintAddress: nftOrSft.address,
        creator: creator.authority,
      });
    });

  return (
    TransactionBuilder.make()

      // Unverify current collection before overriding it.
      // Otherwise, the previous collection size will not be properly decremented.
      .when(shouldUnverifyCurrentCollection, (builder) =>
        builder.add(
          metaplex
            .nfts()
            .builders()
            .unverifyCollection({
              mintAddress: nftOrSft.address,
              collectionMintAddress: nftOrSft.collection?.address as PublicKey,
              collectionAuthority: updateAuthority,
              isSizedCollection: params.oldCollectionIsSized ?? true,
            })
        )
      )

      // Update the metadata account.
      .when(shouldSendUpdateInstruction, (builder) =>
        builder.add({
          instruction: createUpdateMetadataAccountV2Instruction(
            {
              metadata: findMetadataPda(nftOrSft.address),
              updateAuthority: updateAuthority.publicKey,
            },
            {
              updateMetadataAccountArgsV2: updateInstructionData,
            }
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
            .verifyCollection({
              mintAddress: nftOrSft.address,
              collectionMintAddress: params.collection as PublicKey,
              collectionAuthority: params.collectionAuthority as Signer,
              isDelegated: params.collectionAuthorityIsDelegated ?? false,
              isSizedCollection: params.collectionIsSized ?? true,
            })
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
  >,
  input: Partial<UpdateNftInput> = {}
): UpdateMetadataAccountArgsV2 => {
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

  const currentCollection = nftOrSft.collection
    ? { ...nftOrSft.collection, key: nftOrSft.collection.address }
    : null;
  const newCollection = input.collection
    ? { key: input.collection, verified: false }
    : null;

  return {
    updateAuthority: input.newUpdateAuthority ?? null,
    primarySaleHappened: input.primarySaleHappened ?? null,
    isMutable: input.isMutable ?? null,
    data: {
      name: input.name ?? nftOrSft.name,
      symbol: input.symbol ?? nftOrSft.symbol,
      uri: input.uri ?? nftOrSft.uri,
      sellerFeeBasisPoints:
        input.sellerFeeBasisPoints ?? nftOrSft.sellerFeeBasisPoints,
      creators: creators.length > 0 ? creators : null,
      uses: input.uses === undefined ? nftOrSft.uses : input.uses,
      collection:
        input.collection === undefined ? currentCollection : newCollection,
    },
  };
};
