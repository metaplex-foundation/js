import type { Metaplex } from '@/Metaplex';
import { _approveNftCollectionAuthorityBuildersClient } from './operations/approveNftCollectionAuthority';
import { _approveNftUseAuthorityBuildersClient } from './operations/approveNftUseAuthority';
import { _createNftBuildersClient } from './operations/createNft';
import { _createSftBuildersClient } from './operations/createSft';
import { _deleteNftBuildersClient } from './operations/deleteNft';
import { _freezeDelegatedNftBuildersClient } from './operations/freezeDelegatedNft';
import { _migrateToSizedCollectionNftBuildersClient } from './operations/migrateToSizedCollectionNft';
import { _printNewEditionBuildersClient } from './operations/printNewEdition';
import { _revokeNftCollectionAuthorityBuildersClient } from './operations/revokeNftCollectionAuthority';
import { _revokeNftUseAuthorityBuildersClient } from './operations/revokeNftUseAuthority';
import { _thawDelegatedNftBuildersClient } from './operations/thawDelegatedNft';
import { _unverifyNftCollectionBuildersClient } from './operations/unverifyNftCollection';
import { _unverifyNftCreatorBuildersClient } from './operations/unverifyNftCreator';
import { _updateNftBuildersClient } from './operations/updateNft';
import { _useNftBuildersClient } from './operations/useNft';
import { _verifyNftCollectionBuildersClient } from './operations/verifyNftCollection';
import { _verifyNftCreatorBuildersClient } from './operations/verifyNftCreator';

export class NftBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  // Create, Update and Delete.
  create = _createNftBuildersClient;
  createSft = _createSftBuildersClient;
  printNewEdition = _printNewEditionBuildersClient;
  update = _updateNftBuildersClient;
  delete = _deleteNftBuildersClient;

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
