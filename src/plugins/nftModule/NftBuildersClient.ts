import type { Metaplex } from '@/Metaplex';
import { createNftBuilder, CreateNftBuilderParams } from './createNft';
import {
  printNewEditionBuilder,
  PrintNewEditionBuilderParams,
} from './printNewEdition';
import { updateNftBuilder, UpdateNftBuilderParams } from './updateNft';
import { useNftBuilder, UseNftBuilderParams } from './useNft';

export class NftBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  create(input: CreateNftBuilderParams) {
    return createNftBuilder(this.metaplex, input);
  }

  printNewEdition(input: PrintNewEditionBuilderParams) {
    return printNewEditionBuilder(this.metaplex, input);
  }

  update(input: UpdateNftBuilderParams) {
    return updateNftBuilder(this.metaplex, input);
  }

  use(input: UseNftBuilderParams) {
    return useNftBuilder(this.metaplex, input);
  }
}
