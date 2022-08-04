import type { Metaplex } from '@/Metaplex';
import { _createMintBuildersClient } from './createMint';
import {
  _createTokenBuildersClient,
  _createTokenIfMissingBuildersClient,
} from './createToken';
import { _createTokenWithMintBuildersClient } from './createTokenWithMint';
import { _mintTokensBuildersClient } from './mintTokens';
import { _sendTokensBuildersClient } from './sendTokens';

export class TokenBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  // Create.
  createMint = _createMintBuildersClient;
  createToken = _createTokenBuildersClient;
  createTokenIfMissing = _createTokenIfMissingBuildersClient;
  createTokenWithMint = _createTokenWithMintBuildersClient;

  // Transfers.
  mint = _mintTokensBuildersClient;
  send = _sendTokensBuildersClient;
}
