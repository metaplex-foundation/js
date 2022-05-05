import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { CoreProgramDriver } from './CoreProgramDriver';

export const coreProgramDriver = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.setProgramDriver(new CoreProgramDriver(metaplex));
  },
});
