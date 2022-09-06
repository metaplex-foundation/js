import type { Metaplex } from '@/Metaplex';
import {
  createCandyGuardBuilder,
  CreateCandyGuardBuilderParams,
  mintFromCandyGuardBuilder,
  MintFromCandyGuardBuilderParams,
  updateCandyGuardBuilder,
  UpdateCandyGuardBuilderParams,
} from './operations';

/**
 * This client allows you to access the underlying Transaction Builders
 * for the write operations of the Candy Guard module.
 *
 * @see {@link CandyGuardClient}
 * @group Module Builders
 */
export class CandyGuardBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  /** {@inheritDoc createCandyGuardBuilder} */
  create(input: CreateCandyGuardBuilderParams) {
    return createCandyGuardBuilder(this.metaplex, input);
  }

  /** {@inheritDoc mintFromCandyGuardBuilder} */
  mint(input: MintFromCandyGuardBuilderParams) {
    return mintFromCandyGuardBuilder(this.metaplex, input);
  }

  /** {@inheritDoc updateCandyGuardBuilder} */
  update(input: UpdateCandyGuardBuilderParams) {
    return updateCandyGuardBuilder(this.metaplex, input);
  }
}
