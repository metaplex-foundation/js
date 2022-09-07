import type { Metaplex } from '@/Metaplex';
import {
  createCandyMachineBuilder,
  CreateCandyMachineBuilderParams,
  deleteCandyMachineBuilder,
  DeleteCandyMachineBuilderParams,
  insertItemsToCandyMachineBuilder,
  InsertItemsToCandyMachineBuilderParams,
  mintCandyMachineBuilder,
  MintCandyMachineBuilderParams,
  updateCandyMachineBuilder,
  UpdateCandyMachineBuilderParams,
} from './operations';

/**
 * This client allows you to access the underlying Transaction Builders
 * for the write operations of the Candy Machine module.
 *
 * @see {@link CandyMachinesClient}
 * @group Module Builders
 */
export class CandyMachinesBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  /** {@inheritDoc createCandyMachineBuilder} */
  create(input: CreateCandyMachineBuilderParams) {
    return createCandyMachineBuilder(this.metaplex, input);
  }

  /** {@inheritDoc deleteCandyMachineBuilder} */
  delete(input: DeleteCandyMachineBuilderParams) {
    return deleteCandyMachineBuilder(this.metaplex, input);
  }

  /** {@inheritDoc insertItemsToCandyMachineBuilder} */
  insertItems(input: InsertItemsToCandyMachineBuilderParams) {
    return insertItemsToCandyMachineBuilder(this.metaplex, input);
  }

  /** {@inheritDoc mintCandyMachineBuilder} */
  mint(input: MintCandyMachineBuilderParams) {
    return mintCandyMachineBuilder(this.metaplex, input);
  }

  /** {@inheritDoc updateCandyMachineBuilder} */
  update(input: UpdateCandyMachineBuilderParams) {
    return updateCandyMachineBuilder(this.metaplex, input);
  }
}
