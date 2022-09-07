import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { Pda } from '@/types';
import { DefaultCandyGuardProgram } from './program';

/** @group Pdas */
export const findCandyGuardPda = (
  baseAddress: PublicKey,
  programId: PublicKey = DefaultCandyGuardProgram.address
): Pda => {
  return Pda.find(programId, [
    Buffer.from('candy_guard', 'utf8'),
    baseAddress.toBuffer(),
  ]);
};
