import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { ArrayProgramDriver } from './ArrayProgramDriver';

export const arrayProgram = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.setProgramDriver(new ArrayProgramDriver(metaplex));
  },
});
