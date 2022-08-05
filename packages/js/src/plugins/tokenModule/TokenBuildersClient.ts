import type { Metaplex } from '@/Metaplex';
import { _approveTokenDelegateAuthorityBuildersClient } from './approveTokenDelegateAuthority';
import { _createMintBuildersClient } from './createMint';
import {
  _createTokenBuildersClient,
  _createTokenIfMissingBuildersClient,
} from './createToken';
import { _createTokenWithMintBuildersClient } from './createTokenWithMint';
import { _freezeTokensBuildersClient } from './freezeTokens';
import { _mintTokensBuildersClient } from './mintTokens';
import { _revokeTokenDelegateAuthorityBuildersClient } from './revokeTokenDelegateAuthority';
import { _sendTokensBuildersClient } from './sendTokens';
import { _thawTokensBuildersClient } from './thawTokens';

export class TokenBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  // Create.
  createMint = _createMintBuildersClient;
  createToken = _createTokenBuildersClient;
  createTokenIfMissing = _createTokenIfMissingBuildersClient;
  createTokenWithMint = _createTokenWithMintBuildersClient;

  // Update.
  mint = _mintTokensBuildersClient;
  send = _sendTokensBuildersClient;
  freeze = _freezeTokensBuildersClient;
  thaw = _thawTokensBuildersClient;

  // Delegate.
  approveDelegateAuthority = _approveTokenDelegateAuthorityBuildersClient;
  revokeDelegateAuthority = _revokeTokenDelegateAuthorityBuildersClient;
}
