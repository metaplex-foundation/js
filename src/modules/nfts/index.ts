export * from './actions';
export * from './models';
export * from './operationHandlers';
export * from './operations';
export * from './transactionBuilders';
export * from './NftClient';

import { Metaplex } from '@/Metaplex';
import { Plugin } from '@/modules/shared';
import * as operations from './operations';
import * as handlers from './operationHandlers';

export const nftPlugin = (): Plugin => ({
  install(metaplex: Metaplex) {
    metaplex.register(operations.CreateNftOperation, handlers.CreateNftOperationHandler);
  },
});
