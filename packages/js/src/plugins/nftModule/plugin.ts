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
    const o = metaplex.operations().register;
    o(approveNftUseAuthorityOperation, approveNftUseAuthorityOperationHandler);
    o(createNftOperation, createNftOperationHandler);
    o(createSftOperation, createSftOperationHandler);
    o(findNftByMetadataOperation, findNftByMetadataOperationHandler);
    o(findNftByMintOperation, findNftByMintOperationHandler);
    o(findNftByTokenOperation, findNftByTokenOperationHandler);
    o(findNftsByCreatorOperation, findNftsByCreatorOperationHandler);
    o(findNftsByMintListOperation, findNftsByMintListOperationHandler);
    o(findNftsByOwnerOperation, findNftsByOwnerOperationHandler);
    o(
      findNftsByUpdateAuthorityOperation,
      findNftsByUpdateAuthorityOperationHandler
    );
    o(loadMetadataOperation, loadMetadataOperationHandler);
    o(printNewEditionOperation, printNewEditionOperationHandler);
    o(revokeNftUseAuthorityOperation, revokeNftUseAuthorityOperationHandler);
    o(unverifyNftCreatorOperation, unverifyNftCreatorOperationHandler);
    o(updateNftOperation, updateNftOperationHandler);
    o(uploadMetadataOperation, uploadMetadataOperationHandler);
    o(useNftOperation, useNftOperationHandler);
    o(verifyNftCreatorOperation, verifyNftCreatorOperationHandler);

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
