import type { Metaplex } from '@/Metaplex';
import { token } from '@/types';
import { Task } from '@/utils';
import { SendTokensInput, SendTokensOutput } from '../tokenModule';
import { _approveNftCollectionAuthorityClient } from './approveNftCollectionAuthority';
import { _approveNftUseAuthorityClient } from './approveNftUseAuthority';
import { _createNftClient } from './createNft';
import { _createSftClient } from './createSft';
import { _findNftByMetadataClient } from './findNftByMetadata';
import { _findNftByMintClient, _refreshNftClient } from './findNftByMint';
import { _findNftByTokenClient } from './findNftByToken';
import { _findNftsByCreatorsClient } from './findNftsByCreator';
import { _findNftsByMintListClient } from './findNftsByMintList';
import { _findNftsByOwnerClient } from './findNftsByOwner';
import { _findNftsByUpdateAuthorityClient } from './findNftsByUpdateAuthority';
import { HasMintAddress, toMintAddress } from './helpers';
import { _loadMetadataClient } from './loadMetadata';
import { _migrateToSizedCollectionNftClient } from './migrateToSizedCollectionNft';
import { NftBuildersClient } from './NftBuildersClient';
import { _printNewEditionClient } from './printNewEdition';
import { _revokeNftCollectionAuthorityClient } from './revokeNftCollectionAuthority';
import { _revokeNftUseAuthorityClient } from './revokeNftUseAuthority';
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
  // TODO(loris): delete

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
  // TODO(loris): freeze;
  // TODO(loris): thaw;
  // TODO(loris): approveDelegateAuthority;
  // TODO(loris): revokeDelegateAuthority;

  send(
    nftOrSft: HasMintAddress,
    options?: Omit<SendTokensInput, 'mint'>
  ): Task<SendTokensOutput> {
    return this.metaplex.tokens().send({
      mint: toMintAddress(nftOrSft),
      amount: token(1),
      ...options,
    });
  }
}
