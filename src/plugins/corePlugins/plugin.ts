import type { Metaplex } from '../../Metaplex';
import { corePrograms } from '../corePrograms/plugin';
import { nftModule } from '../nftModule/plugin';
import { candyMachineModule } from '../candyMachineModule/plugin';

export const corePlugins = () => ({
  install(metaplex: Metaplex) {
    metaplex.use(corePrograms());
    metaplex.use(nftModule());
    metaplex.use(candyMachineModule());
  },
});
