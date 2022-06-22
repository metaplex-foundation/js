import { PublicKey } from '@solana/web3.js';
import { createVerifyCollectionInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { Signer } from '@/types';
import { InstructionWithSigners } from '@/utils';

export interface CreateVerifyCollectionInstructionWithSignersParam {
  metadata: PublicKey;
  collectionAuthority: Signer;
  payer: Signer;
  collectionMint: PublicKey;
  collection: PublicKey;
  collectionMasterEditionAccount: PublicKey;
  instructionKey?: string;
}

export const createVerifyCollectionInstructionWithSigners = (
  params: CreateVerifyCollectionInstructionWithSignersParam
): InstructionWithSigners => {
  const {
    metadata,
    collectionAuthority,
    payer,
    collectionMint,
    collection,
    collectionMasterEditionAccount,
    instructionKey = 'verifyCollection',
  } = params;

  return {
    instruction: createVerifyCollectionInstruction({
      metadata,
      collectionAuthority: collectionAuthority.publicKey,
      payer: payer.publicKey,
      collectionMint,
      collection,
      collectionMasterEditionAccount,
    }),
    signers: [collectionAuthority, payer],
    key: instructionKey,
  };
};
