import type { Metaplex } from '@/Metaplex';
import { ErrorWithLogs, MetaplexPlugin } from '@/types';
import { cusper } from '@metaplex-foundation/mpl-token-metadata';
import {
  approveNftCollectionAuthorityOperation,
  approveNftCollectionAuthorityOperationHandler,
} from './approveNftCollectionAuthority';
import {
  approveNftUseAuthorityOperation,
  approveNftUseAuthorityOperationHandler,
} from './approveNftUseAuthority';
import { createNftOperation, createNftOperationHandler } from './createNft';
import { createSftOperation, createSftOperationHandler } from './createSft';
import { deleteNftOperation, deleteNftOperationHandler } from './deleteNft';
import {
  findNftByMetadataOperation,
  findNftByMetadataOperationHandler,
} from './findNftByMetadata';
import {
  findNftByMintOperation,
  findNftByMintOperationHandler,
} from './findNftByMint';
import {
  findNftByTokenOperation,
  findNftByTokenOperationHandler,
} from './findNftByToken';
import {
  findNftsByCreatorOperation,
  findNftsByCreatorOperationHandler,
} from './findNftsByCreator';
import {
  findNftsByMintListOperation,
  findNftsByMintListOperationHandler,
} from './findNftsByMintList';
import {
  findNftsByOwnerOperation,
  findNftsByOwnerOperationHandler,
} from './findNftsByOwner';
import {
  findNftsByUpdateAuthorityOperation,
  findNftsByUpdateAuthorityOperationHandler,
} from './findNftsByUpdateAuthority';
import {
  freezeDelegatedNftOperation,
  freezeDelegatedNftOperationHandler,
} from './freezeDelegatedNft';
import { TokenMetadataGpaBuilder } from './gpaBuilders';
import {
  loadMetadataOperation,
  loadMetadataOperationHandler,
} from './loadMetadata';
import {
  migrateToSizedCollectionNftOperation,
  migrateToSizedCollectionNftOperationHandler,
} from './migrateToSizedCollectionNft';
import { NftClient } from './NftClient';
import {
  printNewEditionOperation,
  printNewEditionOperationHandler,
} from './printNewEdition';
import { TokenMetadataProgram } from './program';
import {
  revokeNftCollectionAuthorityOperation,
  revokeNftCollectionAuthorityOperationHandler,
} from './revokeNftCollectionAuthority';
import {
  revokeNftUseAuthorityOperation,
  revokeNftUseAuthorityOperationHandler,
} from './revokeNftUseAuthority';
import {
  thawDelegatedNftOperation,
  thawDelegatedNftOperationHandler,
} from './thawDelegatedNft';
import {
  unverifyNftCollectionOperation,
  unverifyNftCollectionOperationHandler,
} from './unverifyNftCollection';
import {
  unverifyNftCreatorOperation,
  unverifyNftCreatorOperationHandler,
} from './unverifyNftCreator';
import { updateNftOperation, updateNftOperationHandler } from './updateNft';
import {
  uploadMetadataOperation,
  uploadMetadataOperationHandler,
} from './uploadMetadata';
import { useNftOperation, useNftOperationHandler } from './useNft';
import {
  verifyNftCollectionOperation,
  verifyNftCollectionOperationHandler,
} from './verifyNftCollection';
import {
  verifyNftCreatorOperation,
  verifyNftCreatorOperationHandler,
} from './verifyNftCreator';

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
