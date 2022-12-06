import type { Metaplex, MetaplexPlugin } from '@metaplex-foundation/js-core';
import { OperationClient } from './OperationClient';

/** @group Plugins */
export const operationModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const operationClient = new OperationClient(metaplex);
    metaplex.operations = () => operationClient;
  },
});

declare module '@metaplex-foundation/js-core/dist/types/Metaplex' {
  interface Metaplex {
    operations(): OperationClient;
  }
}
