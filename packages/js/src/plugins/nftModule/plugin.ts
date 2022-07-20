import { cusper } from '@metaplex-foundation/mpl-token-metadata';
import type { Metaplex } from '@/Metaplex';
import { TokenMetadataProgram } from './program';
import { TokenMetadataGpaBuilder } from './gpaBuilders';
import { ErrorWithLogs, MetaplexPlugin } from '@/types';
import { NftClient } from './NftClient';
import { createNftOperation, createNftOperationHandler } from './createNft';
import {
  findNftByMintOperationHandler,
  findNftByMintOperation,
} from './findNftByMint';
import {
  findNftsByCreatorOperationHandler,
  findNftsByCreatorOperation,
} from './findNftsByCreator';
import {
  findNftsByMintListOperationHandler,
  findNftsByMintListOperation,
} from './findNftsByMintList';
import {
  findNftsByOwnerOperationHandler,
  findNftsByOwnerOperation,
} from './findNftsByOwner';
import {
  findNftsByUpdateAuthorityOperationHandler,
  findNftsByUpdateAuthorityOperation,
} from './findNftsByUpdateAuthority';
import {
  findMintWithMetadataByAddressOperation,
  findMintWithMetadataByAddressOperationHandler,
} from './findMintWithMetadataByAddress';
import {
  findMintWithMetadataByMetadataOperation,
  findMintWithMetadataByMetadataOperationHandler,
} from './findMintWithMetadataByMetadata';
import {
  findTokenWithMetadataByAddressOperation,
  findTokenWithMetadataByAddressOperationHandler,
} from './findTokenWithMetadataByAddress';
import {
  findTokenWithMetadataByMetadataOperation,
  findTokenWithMetadataByMetadataOperationHandler,
} from './findTokenWithMetadataByMetadata';
import {
  findTokenWithMetadataByMintOperation,
  findTokenWithMetadataByMintOperationHandler,
} from './findTokenWithMetadataByMint';
import {
  loadMetadataOperation,
  loadMetadataOperationHandler,
} from './loadMetadata';
import { loadNftOperation, loadNftOperationHandler } from './loadNft';
import {
  printNewEditionOperation,
  printNewEditionOperationHandler,
} from './printNewEdition';
import { updateNftOperation, updateNftOperationHandler } from './updateNft';
import {
  uploadMetadataOperation,
  uploadMetadataOperationHandler,
} from './uploadMetadata';
import { useNftOperation, useNftOperationHandler } from './useNft';

export const nftModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    // Token Metadata Program.
    metaplex.programs().register({
      name: 'TokenMetadataProgram',
      address: TokenMetadataProgram.publicKey,
      errorResolver: (error: ErrorWithLogs) =>
        cusper.errorFromProgramLogs(error.logs, false),
      gpaResolver: (metaplex: Metaplex) =>
        new TokenMetadataGpaBuilder(metaplex, TokenMetadataProgram.publicKey),
    });

    // Operations.
    const op = metaplex.operations();
    op.register(createNftOperation, createNftOperationHandler);
    op.register(
      findMintWithMetadataByAddressOperation,
      findMintWithMetadataByAddressOperationHandler
    );
    op.register(
      findMintWithMetadataByMetadataOperation,
      findMintWithMetadataByMetadataOperationHandler
    );
    op.register(findNftByMintOperation, findNftByMintOperationHandler);
    op.register(findNftsByCreatorOperation, findNftsByCreatorOperationHandler);
    op.register(
      findNftsByMintListOperation,
      findNftsByMintListOperationHandler
    );
    op.register(findNftsByOwnerOperation, findNftsByOwnerOperationHandler);
    op.register(
      findNftsByUpdateAuthorityOperation,
      findNftsByUpdateAuthorityOperationHandler
    );
    op.register(
      findTokenWithMetadataByAddressOperation,
      findTokenWithMetadataByAddressOperationHandler
    );
    op.register(
      findTokenWithMetadataByMetadataOperation,
      findTokenWithMetadataByMetadataOperationHandler
    );
    op.register(
      findTokenWithMetadataByMintOperation,
      findTokenWithMetadataByMintOperationHandler
    );
    op.register(loadMetadataOperation, loadMetadataOperationHandler);
    op.register(loadNftOperation, loadNftOperationHandler);
    op.register(printNewEditionOperation, printNewEditionOperationHandler);
    op.register(updateNftOperation, updateNftOperationHandler);
    op.register(uploadMetadataOperation, uploadMetadataOperationHandler);
    op.register(useNftOperation, useNftOperationHandler);

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
