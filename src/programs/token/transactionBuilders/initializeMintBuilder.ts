import { PublicKey } from '@solana/web3.js';
import {
  createInitializeMintInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Signer } from '@/types';
import { TransactionBuilder } from '@/utils';

export interface InitializeMintBuilderParams {
  decimals: number;
  mint: Signer;
  mintAuthority: PublicKey;
  freezeAuthority?: PublicKey;
  tokenProgram?: PublicKey;
  instructionKey?: string;
}

export const initializeMintBuilder = (
  params: InitializeMintBuilderParams
): TransactionBuilder => {
  const {
    decimals,
    mint,
    mintAuthority,
    freezeAuthority = null,
    tokenProgram = TOKEN_PROGRAM_ID,
    instructionKey = 'initializeMint',
  } = params;

  return TransactionBuilder.make().add({
    instruction: createInitializeMintInstruction(
      mint.publicKey,
      decimals,
      mintAuthority,
      freezeAuthority,
      tokenProgram
    ),
    signers: [mint],
    key: instructionKey,
  });
};
