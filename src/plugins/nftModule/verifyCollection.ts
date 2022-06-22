import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { useOperation, Operation, Signer, OperationHandler } from '@/types';
import { Nft } from './Nft';
import { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import { createVerifyCollectionInstructionWithSigners } from '@/programs/tokenMetadata/instructions/createVerifyCollectionInstruction';

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

  // Data.
  collection: PublicKey;
  collectionMasterEditionAccount: PublicKey;

  // Signers.
  collectionAuthority: Signer;
  payer: Signer;

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
        collection,
        collectionMasterEditionAccount,
        collectionAuthority,
        payer,
        confirmOptions,
      } = operation.input;

      if (!nft.collection) throw new Error('collection not found');

      const { signature } = await metaplex.rpc().sendAndConfirmTransaction(
        verifyCollectionBuilder({
          metadata: nft.metadataAccount.publicKey,
          collectionMint: nft.collection?.key,
          collection,
          collectionMasterEditionAccount,
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
