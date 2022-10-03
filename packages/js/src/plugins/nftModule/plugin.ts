import { cusper, PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { ProgramClient } from '../programModule';
import { NftClient } from './NftClient';
import {
  approveNftCollectionAuthorityOperation,
  approveNftCollectionAuthorityOperationHandler,
  approveNftUseAuthorityOperation,
  approveNftUseAuthorityOperationHandler,
  createNftOperation,
  createNftOperationHandler,
  createSftOperation,
  createSftOperationHandler,
  deleteNftOperation,
  deleteNftOperationHandler,
  findNftByMetadataOperation,
  findNftByMetadataOperationHandler,
  findNftByMintOperation,
  findNftByMintOperationHandler,
  findNftByTokenOperation,
  findNftByTokenOperationHandler,
  findNftsByCreatorOperation,
  findNftsByCreatorOperationHandler,
  findNftsByMintListOperation,
  findNftsByMintListOperationHandler,
  findNftsByOwnerOperation,
  findNftsByOwnerOperationHandler,
  findNftsByUpdateAuthorityOperation,
  findNftsByUpdateAuthorityOperationHandler,
  freezeDelegatedNftOperation,
  freezeDelegatedNftOperationHandler,
  loadMetadataOperation,
  loadMetadataOperationHandler,
  migrateToSizedCollectionNftOperation,
  migrateToSizedCollectionNftOperationHandler,
  printNewEditionOperation,
  printNewEditionOperationHandler,
  revokeNftCollectionAuthorityOperation,
  revokeNftCollectionAuthorityOperationHandler,
  revokeNftUseAuthorityOperation,
  revokeNftUseAuthorityOperationHandler,
  thawDelegatedNftOperation,
  thawDelegatedNftOperationHandler,
  unverifyNftCollectionOperation,
  unverifyNftCollectionOperationHandler,
  unverifyNftCreatorOperation,
  unverifyNftCreatorOperationHandler,
  updateNftOperation,
  updateNftOperationHandler,
  uploadMetadataOperation,
  uploadMetadataOperationHandler,
  useNftOperation,
  useNftOperationHandler,
  verifyNftCollectionOperation,
  verifyNftCollectionOperationHandler,
  verifyNftCreatorOperation,
  verifyNftCreatorOperationHandler,
} from './operations';
import { ErrorWithLogs, MetaplexPlugin, Program } from '@/types';
import type { Metaplex } from '@/Metaplex';

/** @group Plugins */
export const nftModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    // Token Metadata Program.
    const tokenMetadataProgram = {
      name: 'TokenMetadataProgram',
      address: PROGRAM_ID,
      errorResolver: (error: ErrorWithLogs) =>
        cusper.errorFromProgramLogs(error.logs, false),
    };
    metaplex.programs().register(tokenMetadataProgram);
    metaplex.programs().getTokenMetadata = function (
      this: ProgramClient,
      programs?: Program[]
    ) {
      return this.get(tokenMetadataProgram.name, programs);
    };

    // Operations.
    const op = metaplex.operations();
    op.register(
      approveNftCollectionAuthorityOperation,
      approveNftCollectionAuthorityOperationHandler
    );
    op.register(
      approveNftUseAuthorityOperation,
      approveNftUseAuthorityOperationHandler
    );
    op.register(createNftOperation, createNftOperationHandler);
    op.register(createSftOperation, createSftOperationHandler);
    op.register(deleteNftOperation, deleteNftOperationHandler);
    op.register(findNftByMetadataOperation, findNftByMetadataOperationHandler);
    op.register(findNftByMintOperation, findNftByMintOperationHandler);
    op.register(findNftByTokenOperation, findNftByTokenOperationHandler);
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
      freezeDelegatedNftOperation,
      freezeDelegatedNftOperationHandler
    );
    op.register(loadMetadataOperation, loadMetadataOperationHandler);
    op.register(
      migrateToSizedCollectionNftOperation,
      migrateToSizedCollectionNftOperationHandler
    );
    op.register(printNewEditionOperation, printNewEditionOperationHandler);
    op.register(
      revokeNftCollectionAuthorityOperation,
      revokeNftCollectionAuthorityOperationHandler
    );
    op.register(
      revokeNftUseAuthorityOperation,
      revokeNftUseAuthorityOperationHandler
    );
    op.register(thawDelegatedNftOperation, thawDelegatedNftOperationHandler);
    op.register(
      unverifyNftCollectionOperation,
      unverifyNftCollectionOperationHandler
    );
    op.register(
      unverifyNftCreatorOperation,
      unverifyNftCreatorOperationHandler
    );
    op.register(updateNftOperation, updateNftOperationHandler);
    op.register(uploadMetadataOperation, uploadMetadataOperationHandler);
    op.register(useNftOperation, useNftOperationHandler);
    op.register(
      verifyNftCollectionOperation,
      verifyNftCollectionOperationHandler
    );
    op.register(verifyNftCreatorOperation, verifyNftCreatorOperationHandler);

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

declare module '../programModule/ProgramClient' {
  interface ProgramClient {
    getTokenMetadata(programs?: Program[]): Program;
  }
}
