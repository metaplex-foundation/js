import type { Metaplex, MetaplexPlugin } from '@metaplex-foundation/js-core';
import { RpcClient } from './RpcClient';

/** @group Plugins */
export const rpcModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const rpcClient = new RpcClient(metaplex);
    metaplex.rpc = () => rpcClient;
  },
});

declare module '@metaplex-foundation/js-core/dist/types/Metaplex' {
  interface Metaplex {
    rpc(): RpcClient;
  }
}
