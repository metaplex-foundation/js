import type { Metaplex } from '@/Metaplex';
import {
  createCandyGuardBuilder,
  CreateCandyGuardBuilderParams,
  updateCandyGuardBuilder,
  UpdateCandyGuardBuilderParams,
} from './operations';

/**
 * This client allows you to access the underlying Transaction Builders
 * for the write operations of the Candy Guard module.
 *
 * @see {@link CandyMachineClient}
 * @group Module Builders
 */
export class CandyMachineBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  /** {@inheritDoc createCandyGuardBuilder} */
  createCandyGuard(input: CreateCandyGuardBuilderParams) {
    return createCandyGuardBuilder(this.metaplex, input);
  }

  /** {@inheritDoc updateCandyGuardBuilder} */
  updateCandyGuard(input: UpdateCandyGuardBuilderParams) {
    return updateCandyGuardBuilder(this.metaplex, input);
  }
}
