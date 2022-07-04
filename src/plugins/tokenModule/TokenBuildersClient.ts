import type { Metaplex } from '@/Metaplex';
import { createMintBuilder, CreateMintBuilderParams } from './createMint';

export class TokenBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  createMint(input: CreateMintBuilderParams) {
    return createMintBuilder(this.metaplex, input);
  }
}
