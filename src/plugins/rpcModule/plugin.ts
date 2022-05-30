import type { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { RpcClient } from './RpcClient';

export const rpcModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const rpcClient = new RpcClient(metaplex);
    metaplex.rpc = () => rpcClient;
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    rpc(): RpcClient;
  }
}
