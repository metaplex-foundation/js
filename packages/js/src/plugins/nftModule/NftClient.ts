import type { Metaplex } from '@/Metaplex';
import { token } from '@/types';
import {
  ApproveTokenDelegateAuthorityInput,
  RevokeTokenDelegateAuthorityInput,
  SendTokensInput,
} from '../tokenModule';
import { HasMintAddress, toMintAddress } from './helpers';
import { NftBuildersClient } from './NftBuildersClient';
import { _approveNftCollectionAuthorityClient } from './operations/approveNftCollectionAuthority';
import { _approveNftUseAuthorityClient } from './operations/approveNftUseAuthority';
import { _createNftClient } from './operations/createNft';
import { _createSftClient } from './operations/createSft';
import { _deleteNftClient } from './operations/deleteNft';
import { _findNftByMetadataClient } from './operations/findNftByMetadata';
import {
  _findNftByMintClient,
  _refreshNftClient,
} from './operations/findNftByMint';
import { _findNftByTokenClient } from './operations/findNftByToken';
import { _findNftsByCreatorsClient } from './operations/findNftsByCreator';
import { _findNftsByMintListClient } from './operations/findNftsByMintList';
import { _findNftsByOwnerClient } from './operations/findNftsByOwner';
import { _findNftsByUpdateAuthorityClient } from './operations/findNftsByUpdateAuthority';
import { _freezeDelegatedNftClient } from './operations/freezeDelegatedNft';
import { _loadMetadataClient } from './operations/loadMetadata';
import { _migrateToSizedCollectionNftClient } from './operations/migrateToSizedCollectionNft';
import { _printNewEditionClient } from './operations/printNewEdition';
import { _revokeNftCollectionAuthorityClient } from './operations/revokeNftCollectionAuthority';
import { _revokeNftUseAuthorityClient } from './operations/revokeNftUseAuthority';
import { _thawDelegatedNftClient } from './operations/thawDelegatedNft';
import { _unverifyNftCollectionClient } from './operations/unverifyNftCollection';
import { _unverifyNftCreatorClient } from './operations/unverifyNftCreator';
import { _updateNftClient } from './operations/updateNft';
import { _uploadMetadataClient } from './operations/uploadMetadata';
import { _useNftClient } from './operations/useNft';
import { _verifyNftCollectionClient } from './operations/verifyNftCollection';
import { _verifyNftCreatorClient } from './operations/verifyNftCreator';

export class NftClient {
  constructor(protected readonly metaplex: Metaplex) {}

  builders() {
    return new NftBuildersClient(this.metaplex);
  }

  // Queries.
  findByMint = _findNftByMintClient;
  findByMetadata = _findNftByMetadataClient;
  findByToken = _findNftByTokenClient;
  findAllByCreator = _findNftsByCreatorsClient;
  findAllByMintList = _findNftsByMintListClient;
  findAllByOwner = _findNftsByOwnerClient;
  findAllByUpdateAuthority = _findNftsByUpdateAuthorityClient;
  refresh = _refreshNftClient;
  load = _loadMetadataClient;

  // Create, Update and Delete.
  create = _createNftClient;
  createSft = _createSftClient;
  printNewEdition = _printNewEditionClient;
  uploadMetadata = _uploadMetadataClient;
  update = _updateNftClient;
  delete = _deleteNftClient;

  // Use.
  use = _useNftClient;
  approveUseAuthority = _approveNftUseAuthorityClient;
  revokeUseAuthority = _revokeNftUseAuthorityClient;

  // Creators.
  verifyCreator = _verifyNftCreatorClient;
  unverifyCreator = _unverifyNftCreatorClient;

  // Collections.
  verifyCollection = _verifyNftCollectionClient;
  unverifyCollection = _unverifyNftCollectionClient;
  approveCollectionAuthority = _approveNftCollectionAuthorityClient;
  revokeCollectionAuthority = _revokeNftCollectionAuthorityClient;
  migrateToSizedCollection = _migrateToSizedCollectionNftClient;

  // Token.
  freezeDelegatedNft = _freezeDelegatedNftClient;
  thawDelegatedNft = _thawDelegatedNftClient;

  // Syntactic sugar.
  send(nftOrSft: HasMintAddress, options?: Omit<SendTokensInput, 'mint'>) {
    return this.metaplex.tokens().send({
      mintAddress: toMintAddress(nftOrSft),
      amount: token(1),
      ...options,
    });
  }

  approveDelegateAuthority(
    nftOrSft: HasMintAddress,
    options: Omit<ApproveTokenDelegateAuthorityInput, 'mintAddress'>
  ) {
    return this.metaplex.tokens().approveDelegateAuthority({
      mintAddress: toMintAddress(nftOrSft),
      ...options,
    });
  }

  revokeDelegateAuthority(
    nftOrSft: HasMintAddress,
    options?: Omit<RevokeTokenDelegateAuthorityInput, 'mintAddress'>
  ) {
    return this.metaplex.tokens().revokeDelegateAuthority({
      mintAddress: toMintAddress(nftOrSft),
      ...options,
    });
  }
}
