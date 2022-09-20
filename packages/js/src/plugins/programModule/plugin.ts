import { ProgramClient } from './ProgramClient';
import type { Metaplex } from '@metaplex-foundation/js';

import { MetaplexPlugin } from '@metaplex-foundation/js';

/** @group Plugins */
export const programModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const programClient = new ProgramClient(metaplex);
    metaplex.programs = () => programClient;
  },
});

declare module '@metaplex-foundation/js/Metaplex' {
  interface Metaplex {
    programs(): ProgramClient;
  }
}
