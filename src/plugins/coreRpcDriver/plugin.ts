import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { CoreRpcDriver } from './CoreRpcDriver';

export const coreRpcDriver = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.setRpcDriver(new CoreRpcDriver(metaplex));
  },
});
