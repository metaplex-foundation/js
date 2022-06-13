import { createUpdateAuthorityInstruction } from '@metaplex-foundation/mpl-candy-machine';
import { Signer } from '@/types';
import { InstructionWithSigners } from '@/utils';
import { PublicKey } from '@solana/web3.js';

export type CreateUpdateAuthorityInstructionWithSignersParams = {
  // Accounts
  candyMachine: PublicKey;
  authority: Signer;
  wallet: PublicKey;

  // Instruction Args
  newAuthority: PublicKey;

  instructionKey?: string;
};

export function createUpdateAuthorityInstructionWithSigners(
  params: CreateUpdateAuthorityInstructionWithSignersParams
): InstructionWithSigners {
  const {
    candyMachine,
    authority,
    wallet,
    newAuthority,
    instructionKey = 'updateCandyMachineAuthority',
  } = params;

  return {
    instruction: createUpdateAuthorityInstruction(
      {
        candyMachine,
        authority: authority.publicKey,
        wallet,
      },
      { newAuthority }
    ),
    signers: [authority],
    key: instructionKey,
  };
}
