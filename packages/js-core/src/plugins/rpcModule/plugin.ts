import { RpcClient } from './RpcClient';
import type { Metaplex } from '@/Metaplex';

import { MetaplexPlugin } from '@/types';

/** @group Plugins */
export const rpcModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const rpcClient = new RpcClient(metaplex);
    metaplex.rpc = () => rpcClient;
  },
});

declare module '@metaplex-foundation/js-core/Metaplex' {
  interface Metaplex {
    rpc(): RpcClient;
  }
}
