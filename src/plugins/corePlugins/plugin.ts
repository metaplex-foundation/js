import { Metaplex } from '../../Metaplex';
import { corePrograms } from '../corePrograms';
import { nftModule } from '../nftModule';
import { candyMachineModule } from '../candyMachineModule';

export const corePlugins = () => ({
  install(metaplex: Metaplex) {
    metaplex.use(corePrograms());
    metaplex.use(nftModule());
    metaplex.use(candyMachineModule());
  },
});
