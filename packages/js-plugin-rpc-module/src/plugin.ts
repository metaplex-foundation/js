import { RpcClient } from './RpcClient';
import type { Metaplex } from '@metaplex-foundation/js/Metaplex';

import { MetaplexPlugin } from '@metaplex-foundation/js';

/** @group Plugins */
export const rpcModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const rpcClient = new RpcClient(metaplex);
    metaplex.rpc = () => rpcClient;
  },
});

declare module '@metaplex-foundation/js/Metaplex' {
  interface Metaplex {
    rpc(): RpcClient;
  }
}
