import type { Metaplex } from '@/Metaplex';
import type { MetaplexPlugin, Program } from '@/types';
import { SystemProgram } from '@solana/web3.js';
import { ProgramClient } from '../programModule';
import {
  createAccountOperation,
  createAccountOperationHandler,
  transferSolOperation,
  transferSolOperationHandler,
} from './operations';
import { SystemClient } from './SystemClient';

/**
 * @group Plugins
 */
/** @group Plugins */
export const systemModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    // Program.
    const systemProgram = {
      name: 'SystemProgram',
      address: SystemProgram.programId,
    };
    metaplex.programs().register(systemProgram);
    metaplex.programs().getSystem = function (
      this: ProgramClient,
      programs?: Program[]
    ) {
      return this.get(systemProgram.name, programs);
    };

    // Operations.
    const op = metaplex.operations();
    op.register(createAccountOperation, createAccountOperationHandler);
    op.register(transferSolOperation, transferSolOperationHandler);

    metaplex.system = function () {
      return new SystemClient(this);
    };
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    system(): SystemClient;
  }
}

declare module '../programModule/ProgramClient' {
  interface ProgramClient {
    getSystem(programs?: Program[]): Program;
  }
}
