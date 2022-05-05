import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { Web3RpcDriver } from './Web3RpcDriver';

export const web3Rpc = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.setRpcDriver(new Web3RpcDriver(metaplex));
  },
});
