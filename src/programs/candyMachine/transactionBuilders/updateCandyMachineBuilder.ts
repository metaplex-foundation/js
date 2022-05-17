import {
  CandyMachineData,
  createUpdateCandyMachineInstruction,
} from '@metaplex-foundation/mpl-candy-machine';
import { Signer } from '@/types';
import { TransactionBuilder } from '@/utils';
import { PublicKey } from '@solana/web3.js';

export type UpdateCandyMachineBuilderParams = {
  // Accounts
  candyMachine: PublicKey;
  authority: Signer;
  wallet: PublicKey;

  // Instruction Args
  data: CandyMachineData;

  instructionKey?: string;
};

export function updateCandyMachineBuilder(
  params: UpdateCandyMachineBuilderParams
): TransactionBuilder {
  const {
    candyMachine,
    authority,
    wallet,
    data,
    instructionKey = 'updateCandyMachine',
  } = params;

  return TransactionBuilder.make().add({
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
  });
}
