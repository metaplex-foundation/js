import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { MapOperationDriver } from './MapOperationDriver';

export const mapOperation = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.setOperationDriver(new MapOperationDriver(metaplex));
  },
});
