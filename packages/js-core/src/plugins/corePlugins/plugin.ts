import type { Metaplex } from '@/Metaplex';

// Low-level modules.
import { identityModule } from '../identityModule';
import { storageModule } from '../storageModule';
import { rpcModule } from '../rpcModule';
import { programModule } from '../programModule';
import { utilsModule } from '../utilsModule';

// Default drivers.
import { guestIdentity } from '../guestIdentity';

// Verticals.
import { systemModule } from '../systemModule';

export const corePlugins = () => ({
  install(metaplex: Metaplex) {
    // Low-level modules.
    metaplex.use(identityModule());
    metaplex.use(storageModule());
    metaplex.use(rpcModule());
    // metaplex.use(operationModule());
    metaplex.use(programModule());
    metaplex.use(utilsModule());

    // Default drivers.
    metaplex.use(guestIdentity());
    // metaplex.use(bundlrStorage());

    // Verticals.
    metaplex.use(systemModule());
  },
});
