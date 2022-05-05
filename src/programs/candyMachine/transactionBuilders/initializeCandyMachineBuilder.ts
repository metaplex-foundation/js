import { PublicKey } from '@solana/web3.js';
import {
  CandyMachineData,
  createInitializeCandyMachineInstruction,
} from '@metaplex-foundation/mpl-candy-machine';
import { Signer } from '@/types';
import { TransactionBuilder } from '@/utils';

export type InitializeCandyMachineBuilderParams = {
  data: CandyMachineData;
  candyMachine: Signer;
  payer: Signer;
  wallet: PublicKey;
  authority: PublicKey;
  instructionKey?: string;
};

export const initializeCandyMachineBuilder = (
  params: InitializeCandyMachineBuilderParams
): TransactionBuilder => {
  const {
    data,
    candyMachine,
    wallet,
    authority,
    payer,
    instructionKey = 'initializeCandyMachine',
  } = params;

  return TransactionBuilder.make().add({
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
  });
};
