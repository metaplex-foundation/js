export * from './actions';
export * from './models';
export * from './operationHandlers';
export * from './operations';
export * from './transactionBuilders';
export * from './NftClient';

import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/MetaplexPlugin';
import { NftClient } from './NftClient';
import * as operations from './operations';
import * as handlers from './operationHandlers';

export const nftPlugin = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.register(operations.CreateNftOperation, handlers.CreateNftOperationHandler);
    metaplex.register(operations.FindNftByMintOperation, handlers.FindNftByMintOperationHandler);

    metaplex.nfts = function () {
      return new NftClient(this);
    };
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    nfts(): NftClient;
  }
}
