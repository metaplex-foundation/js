import type { Metaplex } from '@/Metaplex';
import { _approveNftCollectionAuthorityBuildersClient } from './approveNftCollectionAuthority';
import { _approveNftUseAuthorityBuildersClient } from './approveNftUseAuthority';
import { _createNftBuildersClient } from './createNft';
import { _createSftBuildersClient } from './createSft';
import { _freezeDelegatedNftBuildersClient } from './freezeDelegatedNft';
import { _migrateToSizedCollectionNftBuildersClient } from './migrateToSizedCollectionNft';
import { _printNewEditionBuildersClient } from './printNewEdition';
import { _revokeNftCollectionAuthorityBuildersClient } from './revokeNftCollectionAuthority';
import { _revokeNftUseAuthorityBuildersClient } from './revokeNftUseAuthority';
import { _thawDelegatedNftBuildersClient } from './thawDelegatedNft';
import { _unverifyNftCollectionBuildersClient } from './unverifyNftCollection';
import { _unverifyNftCreatorBuildersClient } from './unverifyNftCreator';
import { _updateNftBuildersClient } from './updateNft';
import { _useNftBuildersClient } from './useNft';
import { _verifyNftCollectionBuildersClient } from './verifyNftCollection';
import { _verifyNftCreatorBuildersClient } from './verifyNftCreator';

export class NftBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  // Create, Update and Delete.
  create = _createNftBuildersClient;
  createSft = _createSftBuildersClient;
  printNewEdition = _printNewEditionBuildersClient;
  update = _updateNftBuildersClient;
  // TODO(loris): delete

  // Use.
  use = _useNftBuildersClient;
  approveUseAuthority = _approveNftUseAuthorityBuildersClient;
  revokeUseAuthority = _revokeNftUseAuthorityBuildersClient;

  // Creators.
  verifyCreator = _verifyNftCreatorBuildersClient;
  unverifyCreator = _unverifyNftCreatorBuildersClient;

  // Collections.
  verifyCollection = _verifyNftCollectionBuildersClient;
  unverifyCollection = _unverifyNftCollectionBuildersClient;
  approveCollectionAuthority = _approveNftCollectionAuthorityBuildersClient;
  revokeCollectionAuthority = _revokeNftCollectionAuthorityBuildersClient;
  migrateToSizedCollection = _migrateToSizedCollectionNftBuildersClient;

  // Token.
  freezeDelegatedNft = _freezeDelegatedNftBuildersClient;
  thawDelegatedNft = _thawDelegatedNftBuildersClient;
}
