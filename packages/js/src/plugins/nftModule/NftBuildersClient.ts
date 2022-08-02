import type { Metaplex } from '@/Metaplex';
import { _createNftBuildersClient } from './createNft';
import { _createSftBuildersClient } from './createSft';
import { _printNewEditionBuildersClient } from './printNewEdition';
import { _unverifyNftCreatorBuildersClient } from './unverifyNftCreator';
import { _updateNftBuildersClient } from './updateNft';
import { _useNftBuildersClient } from './useNft';
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
  // TODO(loris): approveUseAuthority;
  // TODO(loris): revokeUseAuthority;

  // Creators.
  verifyCreator = _verifyNftCreatorBuildersClient;
  unverifyCreator = _unverifyNftCreatorBuildersClient;

  // Collections.
  // TODO(loris): verifyCollection;
  // TODO(loris): unverifyCollection;
  // TODO(loris): approveCollectionAuthority;
  // TODO(loris): revokeCollectionAuthority;

  // Token.
  // TODO(loris): freeze;
  // TODO(loris): thaw;
}
