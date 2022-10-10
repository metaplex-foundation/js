import type { Metaplex } from '@metaplex-foundation/js-core';

// Low-level modules.
import { identityModule } from '../identityModule';
import { storageModule } from '../../../../../packages/js-core/src/plugins/storageModule';
import { rpcModule } from '../rpc';
import { operationModule } from '../../../../../packages/js-plugin-operation-module/src';
import { programModule } from '../program';
import { utilsModule } from '../../../../../packages/js-core/src/plugins/utilsModule';

// Default drivers.
import { guestIdentity } from '../guestIdentity';
import { bundlrStorage } from '../bundlrStorage';

// Verticals.
import { systemModule } from '../systemModule';
import { tokenModule } from '../tokenModule';
import { nftModule } from '../nftModule';
import { candyMachineV2Module } from '../candyMachineV2Module';
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

    // Verticals.
    metaplex.use(systemModule());
    metaplex.use(tokenModule());
    metaplex.use(nftModule());
    metaplex.use(candyMachineV2Module());
    metaplex.use(candyMachineModule());
    metaplex.use(auctionHouseModule());
  },
});
