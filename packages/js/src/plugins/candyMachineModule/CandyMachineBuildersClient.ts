import type { Metaplex } from '@/Metaplex';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from './guards';
import {
  createCandyGuardBuilder,
  CreateCandyGuardBuilderParams,
  createCandyMachineBuilder,
  CreateCandyMachineBuilderParams,
  deleteCandyGuardBuilder,
  DeleteCandyGuardBuilderParams,
  deleteCandyMachineBuilder,
  DeleteCandyMachineBuilderParams,
  insertCandyMachineItemsBuilder,
  InsertCandyMachineItemsBuilderParams,
  mintFromCandyMachineBuilder,
  MintFromCandyMachineBuilderParams,
  unwrapCandyGuardBuilder,
  UnwrapCandyGuardBuilderParams,
  updateCandyGuardBuilder,
  UpdateCandyGuardBuilderParams,
  updateCandyMachineBuilder,
  UpdateCandyMachineBuilderParams,
  wrapCandyGuardBuilder,
  WrapCandyGuardBuilderParams,
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
    input: CreateCandyMachineBuilderParams<T>
  ) {
    return createCandyMachineBuilder(this.metaplex, input);
  }

  /** {@inheritDoc createCandyGuardBuilder} */
  createCandyGuard<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    input: CreateCandyGuardBuilderParams<T>
  ) {
    return createCandyGuardBuilder(this.metaplex, input);
  }

  /** {@inheritDoc deleteCandyMachineBuilder} */
  delete(input: DeleteCandyMachineBuilderParams) {
    return deleteCandyMachineBuilder(this.metaplex, input);
  }

  /** {@inheritDoc deleteCandyGuardBuilder} */
  deleteCandyGuard(input: DeleteCandyGuardBuilderParams) {
    return deleteCandyGuardBuilder(this.metaplex, input);
  }

  /** {@inheritDoc insertCandyMachineItemsBuilder} */
  insertItems(input: InsertCandyMachineItemsBuilderParams) {
    return insertCandyMachineItemsBuilder(this.metaplex, input);
  }

  /** {@inheritDoc mintFromCandyMachineBuilder} */
  mint(input: MintFromCandyMachineBuilderParams) {
    return mintFromCandyMachineBuilder(this.metaplex, input);
  }

  /** {@inheritDoc unwrapCandyGuardBuilder} */
  unwrapCandyGuard(input: UnwrapCandyGuardBuilderParams) {
    return unwrapCandyGuardBuilder(this.metaplex, input);
  }

  /** {@inheritDoc updateCandyMachineBuilder} */
  update<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    input: UpdateCandyMachineBuilderParams<T>
  ) {
    return updateCandyMachineBuilder(this.metaplex, input);
  }

  /** {@inheritDoc updateCandyGuardBuilder} */
  updateCandyGuard<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    input: UpdateCandyGuardBuilderParams<T>
  ) {
    return updateCandyGuardBuilder(this.metaplex, input);
  }

  /** {@inheritDoc wrapCandyGuardBuilder} */
  wrapCandyGuard(input: WrapCandyGuardBuilderParams) {
    return wrapCandyGuardBuilder(this.metaplex, input);
  }
}
