import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import {
  Collection,
  createUpdateMetadataAccountV2Instruction,
  UpdateMetadataAccountArgsV2,
  Uses,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  useOperation,
  Operation,
  Signer,
  OperationHandler,
  Creator,
  toNullCreators,
} from '@/types';
import { Nft } from './Nft';
import { Metaplex } from '@/Metaplex';
import { Option, TransactionBuilder } from '@/utils';
import { NoInstructionsToSendError } from '@/errors';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import isEqual from 'lodash.isequal';
import { Sft } from './Sft';

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
  creators?: Creator[];
  collection?: Option<Collection>;
  uses?: Option<Uses>;
  primarySaleHappened?: boolean;
  isMutable?: boolean;

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

  // TODO
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
  );
};

const toInstructionData = (
  nftOrSft: Nft | Sft,
  input: Partial<UpdateNftInput> = {}
): UpdateMetadataAccountArgsV2 => {
  const creators = input.creators ?? nftOrSft.creators;
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
      creators: toNullCreators(creators),
      collection:
        input.collection === undefined ? nftOrSft.collection : input.collection,
      uses: input.uses === undefined ? nftOrSft.uses : input.uses,
    },
  };
};
