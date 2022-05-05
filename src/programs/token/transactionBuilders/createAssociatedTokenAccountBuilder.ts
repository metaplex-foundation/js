import { PublicKey } from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Signer } from '@/types';
import { TransactionBuilder } from '@/utils';

export interface CreateAssociatedTokenAccountBuilderParams {
  payer: Signer;
  associatedToken: PublicKey;
  owner: PublicKey;
  mint: PublicKey;
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;
  instructionKey?: string;
}

export const createAssociatedTokenAccountBuilder = (
  params: CreateAssociatedTokenAccountBuilderParams
): TransactionBuilder => {
  const {
    payer,
    associatedToken,
    owner,
    mint,
    tokenProgram = TOKEN_PROGRAM_ID,
    associatedTokenProgram = ASSOCIATED_TOKEN_PROGRAM_ID,
    instructionKey = 'createAssociatedTokenAccount',
  } = params;

  return TransactionBuilder.make().add({
    instruction: createAssociatedTokenAccountInstruction(
      payer.publicKey,
      associatedToken,
      owner,
      mint,
      tokenProgram,
      associatedTokenProgram
    ),
    signers: [payer],
    key: instructionKey,
  });
};
