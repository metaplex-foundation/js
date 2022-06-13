import {
  CandyMachineData,
  createUpdateCandyMachineInstruction,
} from '@metaplex-foundation/mpl-candy-machine';
import { Signer } from '@/types';
import { InstructionWithSigners } from '@/utils';
import { PublicKey } from '@solana/web3.js';

export type CreateUpdateCandyMachineInstructionWithSignersParams = {
  // Accounts
  candyMachine: PublicKey;
  authority: Signer;
  wallet: PublicKey;

  // Instruction Args
  data: CandyMachineData;

  instructionKey?: string;
};

export function createUpdateCandyMachineInstructionWithSigners(
  params: CreateUpdateCandyMachineInstructionWithSignersParams
): InstructionWithSigners {
  const {
    candyMachine,
    authority,
    wallet,
    data,
    instructionKey = 'updateCandyMachine',
  } = params;

  return {
    instruction: createUpdateCandyMachineInstruction(
      {
        candyMachine,
        authority: authority.publicKey,
        wallet,
      },
      { data }
    ),
    signers: [authority],
    key: instructionKey,
  };
}
