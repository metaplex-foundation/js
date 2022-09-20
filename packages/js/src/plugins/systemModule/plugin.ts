import { SystemProgram } from '@solana/web3.js';
import {
  createAccountOperation,
  createAccountOperationHandler,
  transferSolOperation,
  transferSolOperationHandler,
} from './operations';
import { SystemClient } from './SystemClient';
import type { MetaplexPlugin } from '@metaplex-foundation/js';
import type { Metaplex } from '@metaplex-foundation/js';

/**
 * @group Plugins
 */
/** @group Plugins */
export const systemModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    // Program.
    metaplex.programs().register({
      name: 'SystemProgram',
      address: SystemProgram.programId,
    });

    // Operations.
    const op = metaplex.operations();
    op.register(createAccountOperation, createAccountOperationHandler);
    op.register(transferSolOperation, transferSolOperationHandler);

    metaplex.system = function () {
      return new SystemClient(this);
    };
  },
});

declare module '@metaplex-foundation/js/Metaplex' {
  interface Metaplex {
    system(): SystemClient;
  }
}
