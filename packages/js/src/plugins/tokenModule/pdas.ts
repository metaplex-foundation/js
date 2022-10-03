import { PublicKey } from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Pda } from '@/types';

/**
 * @group Pdas
 * @deprecated Please use `metaplex.tokens().pdas().associatedTokenAccount(...)` instead.
 */
export const findAssociatedTokenAccountPda = (
  mint: PublicKey,
  owner: PublicKey,
  tokenProgramId: PublicKey = TOKEN_PROGRAM_ID,
  associatedTokenProgramId: PublicKey = ASSOCIATED_TOKEN_PROGRAM_ID
): Pda => {
  return Pda.find(associatedTokenProgramId, [
    owner.toBuffer(),
    tokenProgramId.toBuffer(),
    mint.toBuffer(),
  ]);
};
