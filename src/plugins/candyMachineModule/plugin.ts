import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { CandyMachineClient } from './CandyMachineClient';
import {
  createCandyMachineOperation,
  createCandyMachineOperationHandler,
} from './createCandyMachine';
import {
  findCandyMachineByAdddressOperation,
  findCandyMachineByAdddressOperationHandler,
} from './findCandyMachineByAddress';

export const candyMachineModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const op = metaplex.operations();
    op.register(createCandyMachineOperation, createCandyMachineOperationHandler);
    op.register(findCandyMachineByAdddressOperation, findCandyMachineByAdddressOperationHandler);

    metaplex.candyMachine = function () {
      return new CandyMachineClient(this);
    };
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    candyMachine(): CandyMachineClient;
  }
}
