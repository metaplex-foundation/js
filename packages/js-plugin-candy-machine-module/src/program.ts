import { PROGRAM_ID } from '@metaplex-foundation/mpl-candy-machine';
import { CandyMachineGpaBuilder } from './gpaBuilders';
import { Metaplex } from '@/Metaplex';

/** @group Programs */
export const CandyMachineProgram = {
  publicKey: PROGRAM_ID,

  accounts(metaplex: Metaplex) {
    return new CandyMachineGpaBuilder(metaplex, this.publicKey);
  },
};
