import type { Metaplex } from '@/Metaplex';
import { _approveNftUseAuthorityBuildersClient } from './approveNftUseAuthority';
import { _createNftBuildersClient } from './createNft';
import { _createSftBuildersClient } from './createSft';
import { _printNewEditionBuildersClient } from './printNewEdition';
import { _revokeNftUseAuthorityBuildersClient } from './revokeNftUseAuthority';
import { _unverifyNftCollectionBuildersClient } from './unverifyNftCollection';
import { _unverifyNftCreatorBuildersClient } from './unverifyNftCreator';
import { _updateNftBuildersClient } from './updateNft';
import { _useNftBuildersClient } from './useNft';
import { _verifyNftCollectionBuildersClient } from './verifyNftCollection';
import { _verifyNftCreatorBuildersClient } from './verifyNftCreator';

export class NftBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  // Create and Update.
  create = _createNftBuildersClient;
  createSft = _createSftBuildersClient;
  printNewEdition = _printNewEditionBuildersClient;
  update = _updateNftBuildersClient;

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
  approveCollectionAuthority = _approveNftUseAuthorityBuildersClient;
  revokeCollectionAuthority = _revokeNftUseAuthorityBuildersClient;
  // TODO(loris): migrateToSizedCollection;

  // Token.
  // TODO(loris): freeze;
  // TODO(loris): thaw;
}
