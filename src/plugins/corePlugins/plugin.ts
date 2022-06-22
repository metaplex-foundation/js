import type { Metaplex } from '../../Metaplex';
import { corePrograms } from '../corePrograms';
import { identityModule } from '../identityModule';
import { storageModule } from '../storageModule';
import { rpcModule } from '../rpcModule';
import { operationModule } from '../operationModule';
import { programModule } from '../programModule';
import { utilsModule } from '../utilsModule';
import { guestIdentity } from '../guestIdentity';
import { bundlrStorage } from '../bundlrStorage';
import { nftModule } from '../nftModule';
import { candyMachineModule } from '../candyMachineModule';
import { auctionHouseModule } from '../auctionHouseModule';

export const corePlugins = () => ({
  install(metaplex: Metaplex) {
    // Low-level modules.
    metaplex.use(identityModule());
    metaplex.use(storageModule());
    metaplex.use(rpcModule());
    metaplex.use(operationModule());
    metaplex.use(programModule());
    metaplex.use(utilsModule());

    // Default drivers.
    metaplex.use(guestIdentity());
    metaplex.use(bundlrStorage());

    // Register core programs.
    metaplex.use(corePrograms());

    // Verticals.
    metaplex.use(nftModule());
    metaplex.use(candyMachineModule());
    metaplex.use(auctionHouseModule());
  },
});
