import { OperationClient } from './OperationClient';
import type { Metaplex as MetaplexType } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';

/** @group Plugins */
export const operationModule = (): MetaplexPlugin => ({
  install(metaplex: MetaplexType) {
    const operationClient = new OperationClient(metaplex);
    metaplex.operations = () => operationClient;
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    operations(): OperationClient;
  }
}
