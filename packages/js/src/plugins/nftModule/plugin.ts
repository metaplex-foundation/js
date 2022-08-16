import type { Metaplex } from '@/Metaplex';
import { ErrorWithLogs, MetaplexPlugin } from '@/types';
import { cusper } from '@metaplex-foundation/mpl-token-metadata';
import { TokenMetadataGpaBuilder } from './gpaBuilders';
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
import { TokenMetadataProgram } from './program';

/** @group Plugins */
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
