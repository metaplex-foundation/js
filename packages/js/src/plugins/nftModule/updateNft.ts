import { NoInstructionsToSendError } from '@/errors';
import { Metaplex } from '@/Metaplex';
import {
  CreatorInput,
  Operation,
  OperationHandler,
  Signer,
  useOperation,
} from '@/types';
import { Option, Task, TransactionBuilder } from '@/utils';
import {
  createUpdateMetadataAccountV2Instruction,
  UpdateMetadataAccountArgsV2,
  Uses,
} from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import isEqual from 'lodash.isequal';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { Nft, NftWithToken } from './Nft';
import type { NftBuildersClient } from './NftBuildersClient';
import type { NftClient } from './NftClient';
import { Sft, SftWithToken } from './Sft';

// -----------------
// Clients
// -----------------

/** @internal */
export function _updateNftClient(
  this: NftClient,
  nftOrSft: Nft | Sft | NftWithToken | SftWithToken,
  input: Omit<UpdateNftInput, 'nftOrSft'>
): Task<UpdateNftOutput> {
  return this.metaplex
    .operations()
    .getTask(updateNftOperation({ ...input, nftOrSft }));
}

/** @internal */
export function _updateNftBuildersClient(
  this: NftBuildersClient,
  input: UpdateNftBuilderParams
) {
  return updateNftBuilder(this.metaplex, input);
}

// -----------------
// Operation
// -----------------

const Key = 'UpdateNftOperation' as const;
export const updateNftOperation = useOperation<UpdateNftOperation>(Key);
export type UpdateNftOperation = Operation<
  typeof Key,
  UpdateNftInput,
  UpdateNftOutput
>;

export interface UpdateNftInput {
  // Accounts and models.
  nftOrSft: Nft | Sft;
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

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface UpdateNftOutput {
  response: SendAndConfirmTransactionResponse;
}

// -----------------
// Handler
// -----------------

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

export type UpdateNftBuilderParams = Omit<UpdateNftInput, 'confirmOptions'> & {
  updateMetadataInstructionKey?: string;
};

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

      // Update the metadata account.
      .when(shouldSendUpdateInstruction, (builder) =>
        builder.add({
          instruction: createUpdateMetadataAccountV2Instruction(
            {
              metadata: nftOrSft.metadataAddress,
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
  nftOrSft: Nft | Sft,
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
    updateAuthority:
      input.newUpdateAuthority ?? nftOrSft.updateAuthorityAddress,
    primarySaleHappened:
      input.primarySaleHappened ?? nftOrSft.primarySaleHappened,
    isMutable: input.isMutable ?? nftOrSft.isMutable,
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
