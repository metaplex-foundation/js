import * as o from './operations';
import * as h from './operationHandlers';
import { CandyMachineClient } from './CandyMachineClient';
import { Metaplex } from '../../Metaplex';
import { MetaplexPlugin } from '../../MetaplexPlugin';

export const candyMachinePlugin = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const op = metaplex.operations();
    op.register(o.initCandyMachineOperation, h.initCandyMachineOperationHandler);
    op.register(
      o.findCandyMachineByAdddressOperation,
      h.findCandyMachineByAdddressOperationHandler
    );
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
