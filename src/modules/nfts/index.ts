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
    metaplex.register(o.UploadMetadataOperation, h.UploadMetadataOperationHandler);
    metaplex.register(o.PlanUploadMetadataOperation, h.PlanUploadMetadataOperationHandler);
    metaplex.register(o.CreateNftOperation, h.CreateNftOperationHandler);
    metaplex.register(o.UpdateNftOperation, h.UpdateNftOperationHandler);
    metaplex.register(o.FindNftByMintOperation, h.FindNftByMintOperationHandler);
    metaplex.register(o.FindNftsByCandyMachineOperation, h.FindNftsByCandyMachineOperationHandler);

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
