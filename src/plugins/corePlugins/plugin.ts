import type { Metaplex } from '../../Metaplex';
import { corePrograms } from '../corePrograms';
import { nftModule } from '../nftModule';
import { candyMachineModule } from '../candyMachineModule';
import { storageModule } from '../storageModule';
import { identityModule } from '../identityModule';

export const corePlugins = () => ({
  install(metaplex: Metaplex) {
    metaplex.use(identityModule());
    metaplex.use(storageModule());
    metaplex.use(corePrograms());
    metaplex.use(nftModule());
    metaplex.use(candyMachineModule());
  },
});
