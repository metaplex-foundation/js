import { CollectionNotFoundError } from '@/errors';
import { Metaplex } from '@/Metaplex';
import {
  findMasterEditionV2Pda,
  findMetadataPda,
  parseMetadataAccount,
  parseOriginalOrPrintEditionAccount,
} from '@/programs';
import { createVerifyCollectionInstructionWithSigners } from '@/programs/tokenMetadata/instructions/createVerifyCollectionInstruction';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { TransactionBuilder } from '@/utils';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { Nft } from './Nft';

const Key = 'VerifyCollectionOperation' as const;
export const verifyCollectionOperation =
  useOperation<VerifyCollectionOperation>(Key);

export type VerifyCollectionOperation = Operation<
  typeof Key,
  VerifyCollectionInput,
  VerifyCollectionOutput
>;

export interface VerifyCollectionInput {
  nft: Nft;

  // Signers.
  collectionAuthority: Signer;
  payer?: Signer;

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface VerifyCollectionOutput {
  transactionId: string;
}

export const verifyCollectionOperationHandler: OperationHandler<VerifyCollectionOperation> =
  {
    handle: async (
      operation: VerifyCollectionOperation,
      metaplex: Metaplex
    ): Promise<VerifyCollectionOutput> => {
      const {
        nft,
        collectionAuthority,
        payer = metaplex.identity(),
        confirmOptions,
      } = operation.input;

      if (!nft.collection) {
        throw new CollectionNotFoundError(nft.mint);
      }

      const collectionMint = nft.collection.key;
      const [collectionMetadata, collectionEdition] = await metaplex
        .rpc()
        .getMultipleAccounts([
          findMetadataPda(collectionMint),
          findMasterEditionV2Pda(collectionMint),
        ]);

      const collectionMetadataAccount =
        parseMetadataAccount(collectionMetadata);
      const collectionEditionAccount =
        parseOriginalOrPrintEditionAccount(collectionEdition);

      if (!collectionMetadataAccount.exists) {
        throw new CollectionNotFoundError(nft.mint);
      }

      if (!collectionEditionAccount.exists) {
        throw new CollectionNotFoundError(nft.mint);
      }

      const { signature } = await metaplex.rpc().sendAndConfirmTransaction(
        verifyCollectionBuilder({
          metadata: nft.metadataAccount.publicKey,
          collectionMint,
          collection: collectionMetadataAccount.publicKey,
          collectionMasterEditionAccount: collectionEditionAccount.publicKey,
          collectionAuthority,
          payer,
        }),
        undefined,
        confirmOptions
      );

      return { transactionId: signature };
    },
  };

export interface VerifyCollectionBuilderParams {
  // Data.
  metadata: PublicKey;
  collectionMint: PublicKey;
  collection: PublicKey;
  collectionMasterEditionAccount: PublicKey;

  // Signers.
  collectionAuthority: Signer;
  payer: Signer;

  // Instruction keys.
  instructionKey?: string;
}

export const verifyCollectionBuilder = (
  params: VerifyCollectionBuilderParams
): TransactionBuilder => {
  const {
    metadata,
    collection,
    collectionAuthority,
    collectionMasterEditionAccount,
    collectionMint,
    payer,
    instructionKey,
  } = params;

  return TransactionBuilder.make().add(
    createVerifyCollectionInstructionWithSigners({
      metadata,
      collection,
      collectionAuthority,
      collectionMasterEditionAccount,
      collectionMint,
      payer,
      instructionKey,
    })
  );
};
