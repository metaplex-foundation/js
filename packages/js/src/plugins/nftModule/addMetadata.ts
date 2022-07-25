import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import {
  Collection,
  Uses,
  createCreateMetadataAccountV2Instruction,
} from '@metaplex-foundation/mpl-token-metadata';
import { Metaplex } from '@/Metaplex';
import {
  useOperation,
  Operation,
  Signer,
  OperationHandler,
  Creator,
  BigNumber,
  toUniformVerifiedCreators,
} from '@/types';
import { findMetadataPda } from './pdas';
import { DisposableScope, Option, TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';

// -----------------
// Operation
// -----------------

const Key = 'AddMetadataOperation' as const;
export const addMetadataOperation = useOperation<AddMetadataOperation>(Key);
export type AddMetadataOperation = Operation<
  typeof Key,
  AddMetadataInput,
  AddMetadataOutput
>;

export interface AddMetadataInput {
  // Accounts.
  mint: PublicKey;
  payer?: Signer; // Defaults to mx.identity().
  updateAuthority?: PublicKey; // Defaults to mx.identity().publicKey.
  mintAuthority?: Signer; // Defaults to mx.identity().

  // Data.
  uri: string;
  name: string;
  sellerFeeBasisPoints: number;
  symbol?: string; // Defaults to an empty string.
  creators?: Creator[]; // Defaults to mx.identity() as a single Creator.
  isMutable?: boolean; // Defaults to true.
  maxSupply?: Option<BigNumber>; // Defaults to 0.
  collection?: Option<Collection>; // Defaults to null.
  uses?: Option<Uses>; // Defaults to null.

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface AddMetadataOutput {
  response: SendAndConfirmTransactionResponse;
  metadataAddress: PublicKey;
}

// -----------------
// Handler
// -----------------

export const addMetadataOperationHandler: OperationHandler<AddMetadataOperation> =
  {
    handle: async (
      operation: AddMetadataOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ) => {
      const builder = await addMetadataBuilder(metaplex, operation.input);
      scope.throwIfCanceled();
      return builder.sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

export type AddMetadataBuilderParams = Omit<
  AddMetadataInput,
  'confirmOptions'
> & {
  createMetadataInstructionKey?: string;
};

export type AddMetadataBuilderContext = Omit<AddMetadataOutput, 'response'>;

export const addMetadataBuilder = (
  metaplex: Metaplex,
  params: AddMetadataBuilderParams
): TransactionBuilder<AddMetadataBuilderContext> => {
  const {
    mint,
    payer = metaplex.identity(),
    updateAuthority = metaplex.identity().publicKey,
    mintAuthority = metaplex.identity(),
  } = params;

  const metadataPda = findMetadataPda(mint);
  const creators =
    params.creators ?? toUniformVerifiedCreators(mintAuthority.publicKey);

  return (
    TransactionBuilder.make<AddMetadataBuilderContext>()
      .setFeePayer(payer)
      .setContext({
        metadataAddress: metadataPda,
      })
      // Create metadata account.
      .add({
        instruction: createCreateMetadataAccountV2Instruction(
          {
            metadata: metadataPda,
            mint,
            mintAuthority: mintAuthority.publicKey,
            payer: payer.publicKey,
            updateAuthority: updateAuthority,
          },
          {
            createMetadataAccountArgsV2: {
              data: {
                name: params.name,
                symbol: params.symbol ?? '',
                uri: params.uri,
                sellerFeeBasisPoints: params.sellerFeeBasisPoints,
                creators,
                collection: params.collection ?? null,
                uses: params.uses ?? null,
              },
              isMutable: params.isMutable ?? true,
            },
          }
        ),
        signers: [payer, mintAuthority],
        key: params.createMetadataInstructionKey ?? 'createMetadata',
      })
  );
};
