import type { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import {
  addConfigLinesOperation,
  addConfigLinesOperationHandler,
} from './addConfigLines';
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
  findCandyMachinesByPublicKeyFieldOnChainOperationHandler,
} from './findCandyMachinesByPublicKeyField';
import {
  updateAuthorityOperation,
  updateAuthorityOperationHandler,
} from './updateAuthority';
import {
  updateCandyMachineOperation,
  updateCandyMachineOperationHandler,
} from './updateCandyMachine';
import { CandyMachinesClient } from './CandyMachinesClient';

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
      findCandyMachinesByPublicKeyFieldOnChainOperationHandler
    );
    op.register(
      updateCandyMachineOperation,
      updateCandyMachineOperationHandler
    );
    op.register(updateAuthorityOperation, updateAuthorityOperationHandler);
    op.register(addConfigLinesOperation, addConfigLinesOperationHandler);

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
