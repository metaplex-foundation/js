import type { Metaplex } from '../../Metaplex';

// Low-level modules.:
import { identityModule } from '../identityModule';
import { storageModule } from '@metaplex-foundation/js-plugin-storage-module';
import { rpcModule } from '../../../../js-plugin-rpc-module/src';
import { operationModule } from '../operationModule';
import { programModule } from '../programModule';
import { utilsModule } from '../utilsModule';

// Default drivers.
import { guestIdentity } from '../guestIdentity';
import { bundlrStorage } from '../bundlrStorage';

// Verticals.
import { systemModule } from '../systemModule';
import { tokenModule } from '@metaplex-foundation/js-plugin-token-module';
import { nftModule } from '@metaplex-foundation/js-plugin-nft-module';
import { candyMachineModule } from '@metaplex-foundation/js-plugin-candy-machine-module';
import { auctionHouseModule } from '@metaplex-foundation/js-plugin-auction-house-module';

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
    metaplex.use(candyMachineModule());
    metaplex.use(auctionHouseModule());
  },
});
