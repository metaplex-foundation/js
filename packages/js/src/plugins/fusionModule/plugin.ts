import { PROGRAM_ID } from 'mpl-trifle';
import { ProgramClient } from '../programModule';
import {
  createFusionParentOperation,
  createFusionParentOperationHandler,
} from './operations';
import { FusionClient } from './FusionClient';
import type { MetaplexPlugin, Program } from '@/types';
import type { Metaplex } from '@/Metaplex';

/** @group Plugins */
export const fusionModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    // Auction House Program.
    const fusionProgram = {
      name: 'FusionProgram',
      address: PROGRAM_ID,
    };
    metaplex.programs().register(fusionProgram);
    metaplex.programs().getAuctionHouse = function (
      this: ProgramClient,
      programs?: Program[]
    ) {
      return this.get(fusionProgram.name, programs);
    };

    const op = metaplex.operations();
    op.register(
      createFusionParentOperation,
      createFusionParentOperationHandler
    );

    metaplex.fusion = function () {
      return new FusionClient(this);
    };
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    fusion(): FusionClient;
  }
}

declare module '../programModule/ProgramClient' {
  interface ProgramClient {
    getFusion(programs?: Program[]): Program;
  }
}
