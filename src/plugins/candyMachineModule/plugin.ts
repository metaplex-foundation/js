import type { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { CandyMachinesClient } from './CandyMachinesClient';
import {
  createCandyMachineOperation,
  createCandyMachineOperationHandler,
} from './createCandyMachine';
import {
  findCandyMachineByAddressOperation,
  findCandyMachineByAddressOperationHandler,
} from './findCandyMachineByAddress';
import {
  findCandyMachinesByPublicKeyFieldOperation,
  findCandyMachinesByPublicKeyFieldOperationHandler,
} from './findCandyMachinesByPublicKeyField';
import {
  findMintedNftsByCandyMachineOperation,
  findMintedNftsByCandyMachineOperationHandler,
} from './findMintedNftsByCandyMachine';
import {
  insertItemsToCandyMachineOperation,
  InsertItemsToCandyMachineOperationHandler,
} from './insertItemsToCandyMachine';
import {
  mintCandyMachineOperation,
  mintCandyMachineOperationHandler,
} from './mintCandyMachine';
import {
  updateCandyMachineOperation,
  updateCandyMachineOperationHandler,
} from './updateCandyMachine';

export const candyMachineModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const op = metaplex.operations();
    op.register(
      createCandyMachineOperation,
      createCandyMachineOperationHandler
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
