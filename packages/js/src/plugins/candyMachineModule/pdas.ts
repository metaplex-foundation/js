import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { Pda } from '@/types';
import { CandyMachineProgram, DefaultCandyGuardProgram } from './programs';

/** @group Pdas */
export const findCandyMachineAuthorityPda = (
  candyMachineAddress: PublicKey,
  programId: PublicKey = CandyMachineProgram.address
): Pda => {
  return Pda.find(programId, [
    Buffer.from('candy_machine', 'utf8'),
    candyMachineAddress.toBuffer(),
  ]);
};

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
