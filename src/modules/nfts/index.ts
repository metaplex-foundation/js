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
    metaplex.register(o.findNftByMintOperation, h.findNftByMintOnChainOperationHandler);
    metaplex.register(
      o.findNftsByCandyMachineOperation,
      h.findNftsByCandyMachineOnChainOperationHandler
    );
    metaplex.register(o.findNftsByCreatorOperation, h.findNftsByCreatorOnChainOperationHandler);
    metaplex.register(o.findNftsByMintListOperation, h.findNftsByMintListOnChainOperationHandler);
    metaplex.register(o.findNftsByOwnerOperation, h.findNftsByOwnerOnChainOperationHandler);
    metaplex.register(o.printNewEditionOperation, h.printNewEditionOperationHandler);
    metaplex.register(o.planUploadMetadataOperation, h.planUploadMetadataOperationHandler);
    metaplex.register(o.updateNftOperation, h.updateNftOperationHandler);
    metaplex.register(o.uploadMetadataOperation, h.uploadMetadataOperationHandler);

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
