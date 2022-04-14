export * from './models/index.js';
export * from './operationHandlers/index.js';
export * from './operations/index.js';
export * from './transactionBuilders/index.js';
export * from './NftClient.js';

import { Metaplex } from '../../Metaplex.js';
import { MetaplexPlugin } from '../../MetaplexPlugin.js';
import { NftClient } from './NftClient.js';
import * as o from './operations/index.js';
import * as h from './operationHandlers/index.js';

export const nftPlugin = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.register(o.CreateNftOperation, h.CreateNftOperationHandler);
    metaplex.register(o.FindNftByMintOperation, h.FindNftByMintOnChainOperationHandler);
    metaplex.register(
      o.FindNftsByCandyMachineOperation,
      h.FindNftsByCandyMachineOnChainOperationHandler
    );
    metaplex.register(o.FindNftsByCreatorOperation, h.FindNftsByCreatorOnChainOperationHandler);
    metaplex.register(o.FindNftsByMintListOperation, h.FindNftsByMintListOnChainOperationHandler);
    metaplex.register(o.FindNftsByOwnerOperation, h.FindNftsByOwnerOnChainOperationHandler);
    metaplex.register(o.PlanUploadMetadataOperation, h.PlanUploadMetadataOperationHandler);
    metaplex.register(o.UpdateNftOperation, h.UpdateNftOperationHandler);
    metaplex.register(o.UploadMetadataOperation, h.UploadMetadataOperationHandler);

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
