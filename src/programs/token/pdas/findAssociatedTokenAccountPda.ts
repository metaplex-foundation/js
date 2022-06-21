import { PublicKey } from '@solana/web3.js';
import { Pda } from '@/types';
import { TokenProgram } from '../TokenProgram';
import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

export const findAssociatedTokenAccountPda = (
  mint: PublicKey,
  owner: PublicKey,
  tokenProgramId: PublicKey = TokenProgram.publicKey,
  associatedTokenProgramId: PublicKey = ASSOCIATED_TOKEN_PROGRAM_ID
): Pda => {
  return Pda.find(associatedTokenProgramId, [
    mint.toBuffer(),
    tokenProgramId.toBuffer(),
    owner.toBuffer(),
  ]);
};
