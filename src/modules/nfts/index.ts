export * from './actions';
export * from './models';
export * from './operationHandlers';
export * from './operations';
export * from './transactionBuilders';
export * from './NftClient';

import { Metaplex } from '@/Metaplex';
import { Plugin } from '@/modules/shared';
import { NftClient } from './NftClient';
import * as operations from './operations';
import * as handlers from './operationHandlers';

export const nftPlugin = (): Plugin => ({
  install(metaplex: Metaplex) {
    metaplex.register(operations.CreateNftOperation, handlers.CreateNftOperationHandler);

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
