import {
  ConfigLine,
  createAddConfigLinesInstruction,
} from '@metaplex-foundation/mpl-candy-machine';
import { Signer } from '@/types';
import { TransactionBuilder } from '@/utils';
import { PublicKey } from '@solana/web3.js';

export type AddConfigLinesBuilderParams = {
  // Accounts
  candyMachine: PublicKey;
  authority: Signer;

  // Instruction Args
  index: number;
  configLines: ConfigLine[];

  instructionKey?: string;
};

export function addConfigLinesBuilder(
  params: AddConfigLinesBuilderParams
): TransactionBuilder {
  const {
    candyMachine,
    authority,
    index,
    configLines,
    instructionKey = 'addConfigLinesToCandyMachine',
  } = params;

  return TransactionBuilder.make().add({
    instruction: createAddConfigLinesInstruction(
      {
        candyMachine,
        authority: authority.publicKey,
      },
      { index, configLines }
    ),
    signers: [authority],
    key: instructionKey,
  });
}
