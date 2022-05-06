import { PublicKey } from '@solana/web3.js';
import { Signer } from '@/types';
import { TransactionBuilder } from '@/utils';
import { createMintBuilder } from './createMintBuilder';
import { createAssociatedTokenAccountBuilder } from './createAssociatedTokenAccountBuilder';
import { mintToBuilder } from './mintToBuilder';

export interface CreateMintAndMintToAssociatedTokenBuilderParams {
  // Data.
  lamports: number;
  decimals: number;
  amount: number | bigint;
  createAssociatedToken?: boolean;

  // Signers.
  mint: Signer;
  payer: Signer;
  mintAuthority: Signer;

  // Public keys.
  owner: PublicKey;
  associatedToken: PublicKey;
  freezeAuthority?: PublicKey;

  // Programs.
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;

  // Instruction keys.
  createAccountInstructionKey?: string;
  initializeMintInstructionKey?: string;
  createAssociatedTokenInstructionKey?: string;
  mintToInstructionKey?: string;
}

export const createMintAndMintToAssociatedTokenBuilder = (
  params: CreateMintAndMintToAssociatedTokenBuilderParams
): TransactionBuilder => {
  const {
    lamports,
    decimals,
    amount,
    createAssociatedToken = true,
    mint,
    payer,
    mintAuthority,
    owner,
    associatedToken,
    freezeAuthority,
    tokenProgram,
    associatedTokenProgram,
    createAccountInstructionKey,
    initializeMintInstructionKey,
    createAssociatedTokenInstructionKey,
    mintToInstructionKey,
  } = params;

  return (
    TransactionBuilder.make()

      // Create and initialize the mint account.
      .add(
        createMintBuilder({
          lamports,
          decimals,
          mint,
          payer,
          mintAuthority: mintAuthority.publicKey,
          freezeAuthority,
          tokenProgram,
          createAccountInstructionKey,
          initializeMintInstructionKey,
        })
      )

      // Create the associated account if it does not exists.
      .when(createAssociatedToken, (tx) =>
        tx.add(
          createAssociatedTokenAccountBuilder({
            payer,
            associatedToken,
            owner,
            mint: mint.publicKey,
            tokenProgram,
            associatedTokenProgram,
            instructionKey: createAssociatedTokenInstructionKey,
          })
        )
      )

      // Mint to the associated token.
      .add(
        mintToBuilder({
          mint: mint.publicKey,
          destination: associatedToken,
          mintAuthority,
          amount,
          tokenProgram,
          instructionKey: mintToInstructionKey,
        })
      )
  );
};
