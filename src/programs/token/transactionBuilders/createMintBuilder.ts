import { PublicKey, Signer } from "@solana/web3.js";
import { MINT_SIZE } from "@solana/spl-token";
import { TransactionBuilder } from "@/programs/shared";
import { createAccountBuilder } from "@/programs/system";
import { initializeMintBuilder } from "@/programs/token";

export interface CreateMintBuilderParams {
  lamports: number;
  decimals: number;
  mint: Signer;
  payer: Signer;
  mintAuthority: PublicKey;
  freezeAuthority?: PublicKey;
  tokenProgram?: PublicKey;
  createAccountInstructionKey?: string;
  initializeMintInstructionKey?: string;
}

export const createMintBuilder = (params: CreateMintBuilderParams): TransactionBuilder => {
  const {
    lamports,
    decimals,
    mint,
    payer,
    mintAuthority,
    freezeAuthority,
    tokenProgram,
    createAccountInstructionKey = 'createAccount',
    initializeMintInstructionKey = 'initializeMint',
  } = params;

  return TransactionBuilder.make()

    // Allocate space on the blockchain for the mint account.
    .add(createAccountBuilder({
      payer: payer,
      newAccount: mint,
      space: MINT_SIZE,
      lamports,
      program: tokenProgram,
      instructionKey: createAccountInstructionKey,
    }))

    // Initialize the mint account.
    .add(initializeMintBuilder({
      decimals,
      mint,
      mintAuthority,
      freezeAuthority,
      tokenProgram,
      instructionKey: initializeMintInstructionKey,
    }));
}
