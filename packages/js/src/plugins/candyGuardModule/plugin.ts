import type { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { CandyGuardClient } from './CandyGuardClient';
import { botTaxGuardManifest } from './guards';
import {
  createCandyGuardOperation,
  createCandyGuardOperationHandler,
  deleteCandyGuardOperation,
  deleteCandyGuardOperationHandler,
  findCandyGuardByAddressOperation,
  findCandyGuardByAddressOperationHandler,
  findCandyGuardsByPublicKeyFieldOperation,
  findCandyGuardsByPublicKeyFieldOperationHandler,
  mintFromCandyGuardOperation,
  mintFromCandyGuardOperationHandler,
  updateCandyGuardOperation,
  updateCandyGuardOperationHandler,
} from './operations';
import { DefaultCandyGuardProgram } from './program';

/** @group Plugins */
export const candyGuardModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    // Client.
    const client = new CandyGuardClient(metaplex);
    metaplex.candyGuards = () => client;

    // Program.
    metaplex.programs().register(DefaultCandyGuardProgram);

    // Default Guards.
    client.guards().register(botTaxGuardManifest);

    // Operations.
    const op = metaplex.operations();
    op.register(createCandyGuardOperation, createCandyGuardOperationHandler);
    op.register(deleteCandyGuardOperation, deleteCandyGuardOperationHandler);
    op.register(
      findCandyGuardByAddressOperation(),
      findCandyGuardByAddressOperationHandler
    );
    op.register(
      findCandyGuardsByPublicKeyFieldOperation,
      findCandyGuardsByPublicKeyFieldOperationHandler
    );
    op.register(
      mintFromCandyGuardOperation,
      mintFromCandyGuardOperationHandler
    );
    op.register(updateCandyGuardOperation, updateCandyGuardOperationHandler);
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    candyGuards(): CandyGuardClient;
  }
}
