import type { Metaplex } from '@/Metaplex';
import { _approveTokenDelegateAuthorityClient } from './approveTokenDelegateAuthority';
import { _createMintClient } from './createMint';
import { _createTokenClient } from './createToken';
import { _createTokenWithMintClient } from './createTokenWithMint';
import { _findMintByAddressClient } from './findMintByAddress';
import { _findTokenByAddressClient } from './findTokenByAddress';
import { _findTokenWithMintByAddressClient } from './findTokenWithMintByAddress';
import { _findTokenWithMintByMintClient } from './findTokenWithMintByMint';
import { _freezeTokensClient } from './freezeTokens';
import { _mintTokensClient } from './mintTokens';
import { _revokeTokenDelegateAuthorityClient } from './revokeTokenDelegateAuthority';
import { _sendTokensClient } from './sendTokens';
import { _thawTokensClient } from './thawTokens';
import { TokenBuildersClient } from './TokenBuildersClient';

export class TokenClient {
  constructor(protected readonly metaplex: Metaplex) {}

  builders() {
    return new TokenBuildersClient(this.metaplex);
  }

  // Queries.
  findMintByAddress = _findMintByAddressClient;
  findTokenByAddress = _findTokenByAddressClient;
  findTokenWithMintByAddress = _findTokenWithMintByAddressClient;
  findTokenWithMintByMint = _findTokenWithMintByMintClient;

  // Create.
  createMint = _createMintClient;
  createToken = _createTokenClient;
  createTokenWithMint = _createTokenWithMintClient;

  // Update.
  mint = _mintTokensClient;
  send = _sendTokensClient;
  freeze = _freezeTokensClient;
  thaw = _thawTokensClient;

  // Delegate.
  approveDelegateAuthority = _approveTokenDelegateAuthorityClient;
  revokeDelegateAuthority = _revokeTokenDelegateAuthorityClient;
}
