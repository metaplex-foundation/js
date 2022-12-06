import type { Metaplex, MetaplexPlugin } from '@metaplex-foundation/js-core';
import { ProgramClient } from './ProgramClient';

/** @group Plugins */
export const programModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const programClient = new ProgramClient(metaplex);
    metaplex.programs = () => programClient;
  },
});

declare module '@metaplex-foundation/js-core' {
  interface Metaplex {
    programs(): ProgramClient;
  }
}
