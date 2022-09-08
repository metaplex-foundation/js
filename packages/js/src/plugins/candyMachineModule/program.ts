import { PROGRAM_ID } from '@metaplex-foundation/mpl-candy-machine';
import { CandyMachineGpaBuilder } from './gpaBuilders';
import { Metaplex as MetaplexType } from '@/Metaplex';

/** @group Programs */
export const CandyMachineProgram = {
  publicKey: PROGRAM_ID,

  accounts(metaplex: MetaplexType) {
    return new CandyMachineGpaBuilder(metaplex, this.publicKey);
  },
};
