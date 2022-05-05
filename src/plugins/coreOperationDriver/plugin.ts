import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { CoreOperationDriver } from './CoreOperationDriver';

export const coreOperationDriver = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.setOperationDriver(new CoreOperationDriver(metaplex));
  },
});
