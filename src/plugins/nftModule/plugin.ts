import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/MetaplexPlugin';
import { NftClient } from './NftClient';
import * as o from './operations';
import * as h from './operationHandlers';

export const nftPlugin = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const op = metaplex.operations();
    op.register(o.createNftOperation, h.createNftOperationHandler);
    op.register(o.findNftByMintOperation, h.findNftByMintOnChainOperationHandler);
    op.register(o.findNftsByCandyMachineOperation, h.findNftsByCandyMachineOnChainOperationHandler);
    op.register(o.findNftsByCreatorOperation, h.findNftsByCreatorOnChainOperationHandler);
    op.register(o.findNftsByMintListOperation, h.findNftsByMintListOnChainOperationHandler);
    op.register(o.findNftsByOwnerOperation, h.findNftsByOwnerOnChainOperationHandler);
    op.register(o.printNewEditionOperation, h.printNewEditionOperationHandler);
    op.register(o.planUploadMetadataOperation, h.planUploadMetadataOperationHandler);
    op.register(o.updateNftOperation, h.updateNftOperationHandler);
    op.register(o.uploadMetadataOperation, h.uploadMetadataOperationHandler);

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
