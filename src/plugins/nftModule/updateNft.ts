import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import {
  Collection,
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
import { SendAndConfirmTransactionResponse } from '..';

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
    return updateNftBuilder(metaplex, operation.input).sendAndConfirm(
      metaplex,
      operation.input.confirmOptions
    );
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
  // TODO
  return TransactionBuilder.make();
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
