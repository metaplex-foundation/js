import type { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { NftClient } from './NftClient';
import { createNftOperation, createNftOperationHandler } from './createNft';
import {
  findNftByMintOnChainOperationHandler,
  findNftByMintOperation,
} from './findNftByMint';
import {
  findNftsByCandyMachineOnChainOperationHandler,
  findNftsByCandyMachineOperation,
} from './findNftsByCandyMachine';
import {
  findNftsByCreatorOnChainOperationHandler,
  findNftsByCreatorOperation,
} from './findNftsByCreator';
import {
  findNftsByMintListOnChainOperationHandler,
  findNftsByMintListOperation,
} from './findNftsByMintList';
import {
  findNftsByOwnerOnChainOperationHandler,
  findNftsByOwnerOperation,
} from './findNftsByOwner';
import {
  printNewEditionOperation,
  printNewEditionOperationHandler,
} from './printNewEdition';
import { updateNftOperation, updateNftOperationHandler } from './updateNft';
import {
  uploadMetadataOperation,
  uploadMetadataOperationHandler,
} from './uploadMetadata';

export const nftModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const op = metaplex.operations();
    op.register(createNftOperation, createNftOperationHandler);
    op.register(findNftByMintOperation, findNftByMintOnChainOperationHandler);
    op.register(
      findNftsByCandyMachineOperation,
      findNftsByCandyMachineOnChainOperationHandler
    );
    op.register(
      findNftsByCreatorOperation,
      findNftsByCreatorOnChainOperationHandler
    );
    op.register(
      findNftsByMintListOperation,
      findNftsByMintListOnChainOperationHandler
    );
    op.register(
      findNftsByOwnerOperation,
      findNftsByOwnerOnChainOperationHandler
    );
    op.register(printNewEditionOperation, printNewEditionOperationHandler);
    op.register(updateNftOperation, updateNftOperationHandler);
    op.register(uploadMetadataOperation, uploadMetadataOperationHandler);

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
