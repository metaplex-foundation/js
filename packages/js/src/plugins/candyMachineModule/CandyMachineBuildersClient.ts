import type { Metaplex } from '@/Metaplex';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from './guards';
import {
  createCandyGuardBuilder,
  CreateCandyGuardBuilderParams,
  createCandyMachineBuilder,
  CreateCandyMachineBuilderParams,
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

  /** {@inheritDoc createCandyMachineBuilder} */
  create<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    input: CreateCandyMachineBuilderParams<
      T extends undefined ? DefaultCandyGuardSettings : T
    >
  ) {
    return createCandyMachineBuilder(this.metaplex, input);
  }

  /** {@inheritDoc createCandyGuardBuilder} */
  createCandyGuard<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    input: CreateCandyGuardBuilderParams<
      T extends undefined ? DefaultCandyGuardSettings : T
    >
  ) {
    return createCandyGuardBuilder(this.metaplex, input);
  }

  /** {@inheritDoc updateCandyGuardBuilder} */
  updateCandyGuard<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    input: UpdateCandyGuardBuilderParams<
      T extends undefined ? DefaultCandyGuardSettings : T
    >
  ) {
    return updateCandyGuardBuilder(this.metaplex, input);
  }
}
