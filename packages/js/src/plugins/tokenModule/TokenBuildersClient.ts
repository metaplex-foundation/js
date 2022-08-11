import type { Metaplex } from '@/Metaplex';
import {
  approveTokenDelegateAuthorityBuilder,
  ApproveTokenDelegateAuthorityBuilderParams,
} from './approveTokenDelegateAuthority';
import { createMintBuilder, CreateMintBuilderParams } from './createMint';
import {
  createTokenBuilder,
  CreateTokenBuilderParams,
  createTokenIfMissingBuilder,
  CreateTokenIfMissingBuilderParams,
} from './createToken';
import {
  createTokenWithMintBuilder,
  CreateTokenWithMintBuilderParams,
} from './createTokenWithMint';
import { freezeTokensBuilder, FreezeTokensBuilderParams } from './freezeTokens';
import { mintTokensBuilder, MintTokensBuilderParams } from './mintTokens';
import {
  revokeTokenDelegateAuthorityBuilder,
  RevokeTokenDelegateAuthorityBuilderParams,
} from './revokeTokenDelegateAuthority';
import { sendTokensBuilder, SendTokensBuilderParams } from './sendTokens';
import { thawTokensBuilder, ThawTokensBuilderParams } from './thawTokens';

export class TokenBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  // -----------------
  // Create
  // -----------------

  createMint(input: CreateMintBuilderParams) {
    return createMintBuilder(this.metaplex, input);
  }

  createToken(input: CreateTokenBuilderParams) {
    return createTokenBuilder(this.metaplex, input);
  }

  createTokenIfMissing(input: CreateTokenIfMissingBuilderParams) {
    return createTokenIfMissingBuilder(this.metaplex, input);
  }

  createTokenWithMint(input: CreateTokenWithMintBuilderParams) {
    return createTokenWithMintBuilder(this.metaplex, input);
  }

  // -----------------
  // Update
  // -----------------

  mint(input: MintTokensBuilderParams) {
    return mintTokensBuilder(this.metaplex, input);
  }

  send(input: SendTokensBuilderParams) {
    return sendTokensBuilder(this.metaplex, input);
  }

  freeze(input: FreezeTokensBuilderParams) {
    return freezeTokensBuilder(this.metaplex, input);
  }

  thaw(input: ThawTokensBuilderParams) {
    return thawTokensBuilder(this.metaplex, input);
  }

  // -----------------
  // Delegate
  // -----------------

  approveDelegateAuthority(input: ApproveTokenDelegateAuthorityBuilderParams) {
    return approveTokenDelegateAuthorityBuilder(this.metaplex, input);
  }

  revokeDelegateAuthority(input: RevokeTokenDelegateAuthorityBuilderParams) {
    return revokeTokenDelegateAuthorityBuilder(this.metaplex, input);
  }
}
