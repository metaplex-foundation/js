import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import {
  Collection,
  Creator,
  DataV2,
  Uses,
} from '@metaplex-foundation/mpl-token-metadata';
import { useOperation, Operation, Signer, OperationHandler } from '@/types';
import { Nft } from './Nft';
import { Metaplex } from '@/Metaplex';
import {
  createUpdateMetadataAccountV2InstructionWithSigners,
  findMetadataPda,
} from '@/programs';
import { TransactionBuilder } from '@/utils';

const Key = 'UpdateNftOperation' as const;
export const updateNftOperation = useOperation<UpdateNftOperation>(Key);
export type UpdateNftOperation = Operation<
  typeof Key,
  UpdateNftInput,
  UpdateNftOutput
>;

export interface UpdateNftInput {
  nft: Nft;

  // Data.
  name?: string;
  symbol?: string;
  uri?: string;
  sellerFeeBasisPoints?: number;
  creators?: Creator[];
  collection?: Collection;
  uses?: Uses;
  newUpdateAuthority?: PublicKey;
  primarySaleHappened?: boolean;
  isMutable?: boolean;

  // Signers.
  updateAuthority?: Signer;

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface UpdateNftOutput {
  transactionId: string;
}

export const updateNftOperationHandler: OperationHandler<UpdateNftOperation> = {
  handle: async (
    operation: UpdateNftOperation,
    metaplex: Metaplex
  ): Promise<UpdateNftOutput> => {
    const {
      nft,
      newUpdateAuthority = nft.updateAuthority,
      primarySaleHappened = nft.primarySaleHappened,
      isMutable = nft.isMutable,
      updateAuthority = metaplex.identity(),
      confirmOptions,
    } = operation.input;

    const data = resolveData(operation.input);

    const metadata = findMetadataPda(nft.mint);

    const { signature } = await metaplex.rpc().sendAndConfirmTransaction(
      updateNftBuilder({
        data,
        newUpdateAuthority,
        primarySaleHappened,
        isMutable,
        updateAuthority,
        metadata,
      }),
      undefined,
      confirmOptions
    );

    return { transactionId: signature };
  },
};

const resolveData = (input: UpdateNftInput): DataV2 => {
  const { nft } = input;

  return {
    name: input.name ?? nft.name,
    symbol: input.symbol ?? nft.symbol,
    uri: input.uri ?? nft.uri,
    sellerFeeBasisPoints:
      input.sellerFeeBasisPoints ?? nft.sellerFeeBasisPoints,
    creators: input.creators ?? nft.creators,
    collection: input.collection ?? nft.collection,
    uses: input.uses ?? nft.uses,
  };
};

export interface UpdateNftBuilderParams {
  // Data.
  data: DataV2;
  newUpdateAuthority: PublicKey;
  primarySaleHappened: boolean;
  isMutable: boolean;

  // Signers.
  updateAuthority: Signer;

  // Public keys.
  metadata: PublicKey;

  // Instruction keys.
  instructionKey?: string;
}

export const updateNftBuilder = (
  params: UpdateNftBuilderParams
): TransactionBuilder => {
  const {
    data,
    isMutable,
    updateAuthority,
    newUpdateAuthority,
    primarySaleHappened,
    metadata,
    instructionKey,
  } = params;

  return TransactionBuilder.make().add(
    createUpdateMetadataAccountV2InstructionWithSigners({
      data,
      newUpdateAuthority,
      primarySaleHappened,
      isMutable,
      metadata,
      updateAuthority,
      instructionKey,
    })
  );
};
