import type { Metaplex } from '@/Metaplex';
import { token } from '@/types';
import {
  ApproveTokenDelegateAuthorityInput,
  RevokeTokenDelegateAuthorityInput,
  SendTokensInput,
} from '../tokenModule';
import { _approveNftCollectionAuthorityClient } from './approveNftCollectionAuthority';
import { _approveNftUseAuthorityClient } from './approveNftUseAuthority';
import { _createNftClient } from './createNft';
import { _createSftClient } from './createSft';
import { _deleteNftClient } from './deleteNft';
import { _findNftByMetadataClient } from './findNftByMetadata';
import { _findNftByMintClient, _refreshNftClient } from './findNftByMint';
import { _findNftByTokenClient } from './findNftByToken';
import { _findNftsByCreatorsClient } from './findNftsByCreator';
import { _findNftsByMintListClient } from './findNftsByMintList';
import { _findNftsByOwnerClient } from './findNftsByOwner';
import { _findNftsByUpdateAuthorityClient } from './findNftsByUpdateAuthority';
import { _freezeDelegatedNftClient } from './freezeDelegatedNft';
import { HasMintAddress, toMintAddress } from './helpers';
import { _loadMetadataClient } from './loadMetadata';
import { _migrateToSizedCollectionNftClient } from './migrateToSizedCollectionNft';
import { NftBuildersClient } from './NftBuildersClient';
import { _printNewEditionClient } from './printNewEdition';
import { _revokeNftCollectionAuthorityClient } from './revokeNftCollectionAuthority';
import { _revokeNftUseAuthorityClient } from './revokeNftUseAuthority';
import { _thawDelegatedNftClient } from './thawDelegatedNft';
import { _unverifyNftCollectionClient } from './unverifyNftCollection';
import { _unverifyNftCreatorClient } from './unverifyNftCreator';
import { _updateNftClient } from './updateNft';
import { _uploadMetadataClient } from './uploadMetadata';
import { _useNftClient } from './useNft';
import { _verifyNftCollectionClient } from './verifyNftCollection';
import { _verifyNftCreatorClient } from './verifyNftCreator';

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
