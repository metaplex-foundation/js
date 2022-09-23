import type { Metaplex } from '@/Metaplex';
import type { MetaplexPlugin } from '@/types';
import { SystemProgram } from '@solana/web3.js';
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

declare module '../../Metaplex' {
  interface Metaplex {
    system(): SystemClient;
  }
}
