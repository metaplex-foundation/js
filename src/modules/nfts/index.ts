export * from './models/index';
export * from './operationHandlers/index';
export * from './operations/index';
export * from './transactionBuilders/index';
export * from './NftClient';

import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/MetaplexPlugin';
import { NftClient } from './NftClient';
import * as o from './operations/index';
import * as h from './operationHandlers/index';

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
