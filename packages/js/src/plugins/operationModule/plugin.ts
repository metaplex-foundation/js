import type { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { OperationClient } from './OperationClient';

/** @group Plugins */
export const operationModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const operationClient = new OperationClient(metaplex);
    metaplex.operations = () => operationClient;
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    operations(): OperationClient;
  }
}
