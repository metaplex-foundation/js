import type { Metaplex } from '@/Metaplex';
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
import { mintTokensBuilder, MintTokensBuilderParams } from './mintTokens';
import { sendTokensBuilder, SendTokensBuilderParams } from './sendTokens';

export class TokenBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

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

  mint(input: MintTokensBuilderParams) {
    return mintTokensBuilder(this.metaplex, input);
  }

  send(input: SendTokensBuilderParams) {
    return sendTokensBuilder(this.metaplex, input);
  }
}
