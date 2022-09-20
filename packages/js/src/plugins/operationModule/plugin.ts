import { OperationClient } from './OperationClient';
import type { Metaplex } from '@metaplex-foundation/js';

import { MetaplexPlugin } from '@metaplex-foundation/js';

/** @group Plugins */
export const operationModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const operationClient = new OperationClient(metaplex);
    metaplex.operations = () => operationClient;
  },
});

declare module '@metaplex-foundation/js/Metaplex' {
  interface Metaplex {
    operations(): OperationClient;
  }
}
