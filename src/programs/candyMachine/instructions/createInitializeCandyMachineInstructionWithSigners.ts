import { PublicKey } from '@solana/web3.js';
import {
  CandyMachineData,
  createInitializeCandyMachineInstruction,
} from '@metaplex-foundation/mpl-candy-machine';
import { Signer } from '@/types';
import { InstructionWithSigners } from '@/utils';

export type CreateInitializeCandyMachineInstructionWithSignersParams = {
  data: CandyMachineData;
  candyMachine: Signer;
  payer: Signer;
  wallet: PublicKey;
  authority: PublicKey;
  instructionKey?: string;
};

export const createInitializeCandyMachineInstructionWithSigners = (
  params: CreateInitializeCandyMachineInstructionWithSignersParams
): InstructionWithSigners => {
  const {
    data,
    candyMachine,
    wallet,
    authority,
    payer,
    instructionKey = 'initializeCandyMachine',
  } = params;

  return {
    instruction: createInitializeCandyMachineInstruction(
      {
        candyMachine: candyMachine.publicKey,
        wallet,
        authority,
        payer: payer.publicKey,
      },
      { data }
    ),
    signers: [candyMachine, payer],
    key: instructionKey,
  };
};
