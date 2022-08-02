import type { Metaplex } from '@/Metaplex';
import { ErrorWithLogs, MetaplexPlugin } from '@/types';
import { cusper } from '@metaplex-foundation/mpl-token-metadata';
import {
  approveNftUseAuthorityOperation,
  approveNftUseAuthorityOperationHandler,
} from './approveNftUseAuthority';
import { createNftOperation, createNftOperationHandler } from './createNft';
import { createSftOperation, createSftOperationHandler } from './createSft';
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
import { TokenMetadataGpaBuilder } from './gpaBuilders';
import {
  loadMetadataOperation,
  loadMetadataOperationHandler,
} from './loadMetadata';
import { NftClient } from './NftClient';
import {
  printNewEditionOperation,
  printNewEditionOperationHandler,
} from './printNewEdition';
import { TokenMetadataProgram } from './program';
import {
  revokeNftUseAuthorityOperation,
  revokeNftUseAuthorityOperationHandler,
} from './revokeNftUseAuthority';
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
      approveNftUseAuthorityOperation,
      approveNftUseAuthorityOperationHandler
    );
    op.register(createNftOperation, createNftOperationHandler);
    op.register(createSftOperation, createSftOperationHandler);
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
    op.register(loadMetadataOperation, loadMetadataOperationHandler);
    op.register(printNewEditionOperation, printNewEditionOperationHandler);
    op.register(
      revokeNftUseAuthorityOperation,
      revokeNftUseAuthorityOperationHandler
    );
    op.register(
      unverifyNftCreatorOperation,
      unverifyNftCreatorOperationHandler
    );
    op.register(updateNftOperation, updateNftOperationHandler);
    op.register(uploadMetadataOperation, uploadMetadataOperationHandler);
    op.register(useNftOperation, useNftOperationHandler);
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
