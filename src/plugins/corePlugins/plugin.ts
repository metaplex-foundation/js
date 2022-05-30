import type { Metaplex } from '../../Metaplex';
import { corePrograms } from '../corePrograms';
import { nftModule } from '../nftModule';
import { candyMachineModule } from '../candyMachineModule';
import { storageModule } from '../storageModule';
import { identityModule } from '../identityModule';
import { guestIdentity } from '../guestIdentity';
import { bundlrStorage } from '../bundlrStorage';

export const corePlugins = () => ({
  install(metaplex: Metaplex) {
    // Low-level modules.
    metaplex.use(identityModule());
    metaplex.use(storageModule());

    // Default drivers.
    metaplex.use(guestIdentity());
    metaplex.use(bundlrStorage());

    // Register core programs.
    metaplex.use(corePrograms());

    // Verticals.
    metaplex.use(nftModule());
    metaplex.use(candyMachineModule());
  },
});
