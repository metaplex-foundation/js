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

/**
 * This client allows you to access the underlying Transaction Builders
 * for the write operations of the Token module.
 *
 * @see {@link TokenClient}
 * @group Module Builders
 * */
export class TokenBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  // -----------------
  // Create
  // -----------------

  /** {@inheritDoc createMintBuilder} */
  createMint(input: CreateMintBuilderParams) {
    return createMintBuilder(this.metaplex, input);
  }

  /** {@inheritDoc createTokenBuilder} */
  createToken(input: CreateTokenBuilderParams) {
    return createTokenBuilder(this.metaplex, input);
  }

  /** {@inheritDoc createTokenIfMissingBuilder} */
  createTokenIfMissing(input: CreateTokenIfMissingBuilderParams) {
    return createTokenIfMissingBuilder(this.metaplex, input);
  }

  /** {@inheritDoc createTokenWithMintBuilder} */
  createTokenWithMint(input: CreateTokenWithMintBuilderParams) {
    return createTokenWithMintBuilder(this.metaplex, input);
  }

  // -----------------
  // Update
  // -----------------

  /** {@inheritDoc mintTokensBuilder} */
  mint(input: MintTokensBuilderParams) {
    return mintTokensBuilder(this.metaplex, input);
  }

  /** {@inheritDoc sendTokensBuilder} */
  send(input: SendTokensBuilderParams) {
    return sendTokensBuilder(this.metaplex, input);
  }

  /** {@inheritDoc freezeTokensBuilder} */
  freeze(input: FreezeTokensBuilderParams) {
    return freezeTokensBuilder(this.metaplex, input);
  }

  /** {@inheritDoc thawTokensBuilder} */
  thaw(input: ThawTokensBuilderParams) {
    return thawTokensBuilder(this.metaplex, input);
  }

  // -----------------
  // Delegate
  // -----------------

  /** {@inheritDoc approveTokenDelegateAuthorityBuilder} */
  approveDelegateAuthority(input: ApproveTokenDelegateAuthorityBuilderParams) {
    return approveTokenDelegateAuthorityBuilder(this.metaplex, input);
  }

  /** {@inheritDoc revokeTokenDelegateAuthorityBuilder} */
  revokeDelegateAuthority(input: RevokeTokenDelegateAuthorityBuilderParams) {
    return revokeTokenDelegateAuthorityBuilder(this.metaplex, input);
  }
}
