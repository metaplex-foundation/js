export * from './models';
export * from './operationHandlers';
export * from './operations';
export * from './transactionBuilders';
export * from './NftClient';

import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/MetaplexPlugin';
import { NftClient } from './NftClient';
import * as o from './operations';
import * as h from './operationHandlers';

export const nftPlugin = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.register(o.createNftOperation, h.createNftOperationHandler);
    metaplex.register(o.findNftByMintOperation, h.FindNftByMintOnChainOperationHandler);
    metaplex.register(
      o.findNftsByCandyMachineOperation,
      h.FindNftsByCandyMachineOnChainOperationHandler
    );
    metaplex.register(o.findNftsByCreatorOperation, h.FindNftsByCreatorOnChainOperationHandler);
    metaplex.register(o.findNftsByMintListOperation, h.FindNftsByMintListOnChainOperationHandler);
    metaplex.register(o.findNftsByOwnerOperation, h.FindNftsByOwnerOnChainOperationHandler);
    metaplex.register(o.planUploadMetadataOperation, h.PlanUploadMetadataOperationHandler);
    metaplex.register(o.updateNftOperation, h.UpdateNftOperationHandler);
    metaplex.register(o.uploadMetadataOperation, h.UploadMetadataOperationHandler);

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
