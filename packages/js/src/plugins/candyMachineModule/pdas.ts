import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { Pda } from '@/types';
import { candyMachineProgram, defaultCandyGuardProgram } from './programs';

/** @group Pdas */
export const findCandyMachineAuthorityPda = (
  candyMachineAddress: PublicKey,
  programId: PublicKey = candyMachineProgram.address
): Pda => {
  return Pda.find(programId, [
    Buffer.from('candy_machine', 'utf8'),
    candyMachineAddress.toBuffer(),
  ]);
};

/** @group Pdas */
export const findCandyGuardPda = (
  baseAddress: PublicKey,
  programId: PublicKey = defaultCandyGuardProgram.address
): Pda => {
  return Pda.find(programId, [
    Buffer.from('candy_guard', 'utf8'),
    baseAddress.toBuffer(),
  ]);
};
