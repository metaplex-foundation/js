import type { Metaplex } from '@/Metaplex';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from './guards';
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
  createCandyGuard<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    input: CreateCandyGuardBuilderParams<T>
  ) {
    return createCandyGuardBuilder<T>(this.metaplex, input);
  }

  /** {@inheritDoc updateCandyGuardBuilder} */
  updateCandyGuard<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    input: UpdateCandyGuardBuilderParams<T>
  ) {
    return updateCandyGuardBuilder<T>(this.metaplex, input);
  }
}
