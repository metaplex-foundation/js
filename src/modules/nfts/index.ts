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
    metaplex.operations().register(o.createNftOperation, h.createNftOperationHandler);
    metaplex
      .operations()
      .register(o.findNftByMintOperation, h.findNftByMintOnChainOperationHandler);
    metaplex
      .operations()
      .register(o.findNftsByCandyMachineOperation, h.findNftsByCandyMachineOnChainOperationHandler);
    metaplex
      .operations()
      .register(o.findNftsByCreatorOperation, h.findNftsByCreatorOnChainOperationHandler);
    metaplex
      .operations()
      .register(o.findNftsByMintListOperation, h.findNftsByMintListOnChainOperationHandler);
    metaplex
      .operations()
      .register(o.findNftsByOwnerOperation, h.findNftsByOwnerOnChainOperationHandler);
    metaplex.operations().register(o.printNewEditionOperation, h.printNewEditionOperationHandler);
    metaplex
      .operations()
      .register(o.planUploadMetadataOperation, h.planUploadMetadataOperationHandler);
    metaplex.operations().register(o.updateNftOperation, h.updateNftOperationHandler);
    metaplex.operations().register(o.uploadMetadataOperation, h.uploadMetadataOperationHandler);

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
