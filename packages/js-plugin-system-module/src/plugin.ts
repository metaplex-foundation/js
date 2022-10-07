import { SystemProgram } from '@solana/web3.js';
import {
  createAccountOperation,
  createAccountOperationHandler,
  transferSolOperation,
  transferSolOperationHandler,
} from './operations';
import { SystemClient } from './SystemClient';
import type { MetaplexPlugin, Program } from '@metaplex-foundation/js-core';
import type { Metaplex } from '@metaplex-foundation/js-core/Metaplex';

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

declare module '@metaplex-foundation/js-core/Metaplex' {
  interface Metaplex {
    system(): SystemClient;
  }
}

declare module '@metaplex-foundation/js-core/plugins/programModule/ProgramClient' {
  interface ProgramClient {
    getSystem(programs?: Program[]): Program;
  }
}
