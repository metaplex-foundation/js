import type { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { ProgramClient } from './ProgramClient';

export const programModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const programClient = new ProgramClient(metaplex);
    metaplex.programs = () => programClient;
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    programs(): ProgramClient;
  }
}
