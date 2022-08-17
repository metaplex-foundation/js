import type { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { CandyMachinesClient } from './CandyMachinesClient';
import {
  createCandyMachineOperation,
  createCandyMachineOperationHandler,
  deleteCandyMachineOperation,
  deleteCandyMachineOperationHandler,
  findCandyMachineByAddressOperation,
  findCandyMachineByAddressOperationHandler,
  findCandyMachinesByPublicKeyFieldOperation,
  findCandyMachinesByPublicKeyFieldOperationHandler,
  findMintedNftsByCandyMachineOperation,
  findMintedNftsByCandyMachineOperationHandler,
  insertItemsToCandyMachineOperation,
  InsertItemsToCandyMachineOperationHandler,
  mintCandyMachineOperation,
  mintCandyMachineOperationHandler,
  updateCandyMachineOperation,
  updateCandyMachineOperationHandler,
} from './operations';

/** @group Plugins */
export const candyMachineModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const op = metaplex.operations();
    op.register(
      createCandyMachineOperation,
      createCandyMachineOperationHandler
    );
    op.register(
      deleteCandyMachineOperation,
      deleteCandyMachineOperationHandler
    );
    op.register(
      findCandyMachineByAddressOperation,
      findCandyMachineByAddressOperationHandler
    );
    op.register(
      findCandyMachinesByPublicKeyFieldOperation,
      findCandyMachinesByPublicKeyFieldOperationHandler
    );
    op.register(
      findMintedNftsByCandyMachineOperation,
      findMintedNftsByCandyMachineOperationHandler
    );
    op.register(
      insertItemsToCandyMachineOperation,
      InsertItemsToCandyMachineOperationHandler
    );
    op.register(mintCandyMachineOperation, mintCandyMachineOperationHandler);
    op.register(
      updateCandyMachineOperation,
      updateCandyMachineOperationHandler
    );

    metaplex.candyMachines = function () {
      return new CandyMachinesClient(this);
    };
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    candyMachines(): CandyMachinesClient;
  }
}
