import type { Metaplex } from '@/Metaplex';
import { createMintBuilder, CreateMintBuilderParams } from './createMint';
import { createTokenBuilder, CreateTokenBuilderParams } from './createToken';

export class TokenBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  createMint(input: CreateMintBuilderParams) {
    return createMintBuilder(this.metaplex, input);
  }

  createToken(input: CreateTokenBuilderParams) {
    return createTokenBuilder(this.metaplex, input);
  }
}
