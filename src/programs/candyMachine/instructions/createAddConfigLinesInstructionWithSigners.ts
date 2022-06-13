import {
  ConfigLine,
  createAddConfigLinesInstruction,
} from '@metaplex-foundation/mpl-candy-machine';
import { Signer } from '@/types';
import { InstructionWithSigners } from '@/utils';
import { PublicKey } from '@solana/web3.js';

export type CreateAddConfigLinesInstructionWithSignersParams = {
  // Accounts
  candyMachine: PublicKey;
  authority: Signer;

  // Instruction Args
  index: number;
  configLines: ConfigLine[];

  instructionKey?: string;
};

export function createAddConfigLinesInstructionWithSigners(
  params: CreateAddConfigLinesInstructionWithSignersParams
): InstructionWithSigners {
  const {
    candyMachine,
    authority,
    index,
    configLines,
    instructionKey = 'addConfigLinesToCandyMachine',
  } = params;

  return {
    instruction: createAddConfigLinesInstruction(
      {
        candyMachine,
        authority: authority.publicKey,
      },
      { index, configLines }
    ),
    signers: [authority],
    key: instructionKey,
  };
}
