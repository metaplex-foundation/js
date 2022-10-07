import { OperationClient } from './OperationClient';
import type { Metaplex } from '@metaplex-foundation/js-core/Metaplex';
import { MetaplexPlugin } from '@metaplex-foundation/js-core';

/** @group Plugins */
export const operationModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const operationClient = new OperationClient(metaplex);
    metaplex.operations = () => operationClient;
  },
});

declare module '@metaplex-foundation/js-core/Metaplex' {
  interface Metaplex {
    operations(): OperationClient;
  }
}
