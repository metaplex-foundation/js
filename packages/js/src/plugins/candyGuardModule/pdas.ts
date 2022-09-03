import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { Pda } from '@/types';
import { CandyMachineProgram } from './program';

/** @group Pdas */
export const findCandyMachineCreatorPda = (
  candyMachine: PublicKey,
  programId: PublicKey = CandyMachineProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('candy_machine', 'utf8'),
    candyMachine.toBuffer(),
  ]);
};

/** @group Pdas */
export const findCandyMachineCollectionPda = (
  candyMachine: PublicKey,
  programId: PublicKey = CandyMachineProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('collection', 'utf8'),
    candyMachine.toBuffer(),
  ]);
};
