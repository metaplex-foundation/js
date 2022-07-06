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
} from '@/types';
import { LazyNft, Nft } from './Nft';
import { Metaplex } from '@/Metaplex';
import { Option, TransactionBuilder } from '@/utils';
import { NoInstructionsToSendError } from '@/errors';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import isEqual from 'lodash.isequal';

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
  nft: Nft | LazyNft;
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
  const { nft, updateAuthority = metaplex.identity() } = params;
  const updateInstructionDataWithoutChanges = toInstructionData(nft);
  const updateInstructionData = toInstructionData(nft, params);
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
              metadata: nft.metadataAddress,
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
  nft: LazyNft | Nft,
  input: Partial<UpdateNftInput> = {}
): UpdateMetadataAccountArgsV2 => {
  return {
    updateAuthority: input.newUpdateAuthority ?? nft.updateAuthorityAddress,
    primarySaleHappened: input.primarySaleHappened ?? nft.primarySaleHappened,
    isMutable: input.isMutable ?? nft.isMutable,
    data: {
      name: input.name ?? nft.name,
      symbol: input.symbol ?? nft.symbol,
      uri: input.uri ?? nft.uri,
      sellerFeeBasisPoints:
        input.sellerFeeBasisPoints ?? nft.sellerFeeBasisPoints,
      creators: input.creators ?? nft.creators,
      collection:
        input.collection === undefined ? nft.collection : input.collection,
      uses: input.uses === undefined ? nft.uses : input.uses,
    },
  };
};
