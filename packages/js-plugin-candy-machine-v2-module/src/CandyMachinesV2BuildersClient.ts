import {
  createCandyMachineV2Builder,
  CreateCandyMachineV2BuilderParams,
  deleteCandyMachineV2Builder,
  DeleteCandyMachineV2BuilderParams,
  insertItemsToCandyMachineV2Builder,
  InsertItemsToCandyMachineV2BuilderParams,
  mintCandyMachineV2Builder,
  MintCandyMachineV2BuilderParams,
  updateCandyMachineV2Builder,
  UpdateCandyMachineV2BuilderParams,
} from './operations';
import type { Metaplex } from '@metaplex-foundation/js-core';

/**
 * This client allows you to access the underlying Transaction Builders
 * for the write operations of the Candy Machine module.
 *
 * @see {@link CandyMachinesV2Client}
 * @group Module Builders
 */
export class CandyMachinesV2BuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  /** {@inheritDoc createCandyMachineV2Builder} */
  create(input: CreateCandyMachineV2BuilderParams) {
    return createCandyMachineV2Builder(this.metaplex, input);
  }

  /** {@inheritDoc deleteCandyMachineV2Builder} */
  delete(input: DeleteCandyMachineV2BuilderParams) {
    return deleteCandyMachineV2Builder(this.metaplex, input);
  }

  /** {@inheritDoc insertItemsToCandyMachineV2Builder} */
  insertItems(input: InsertItemsToCandyMachineV2BuilderParams) {
    return insertItemsToCandyMachineV2Builder(this.metaplex, input);
  }

  /** {@inheritDoc mintCandyMachineV2Builder} */
  mint(input: MintCandyMachineV2BuilderParams) {
    return mintCandyMachineV2Builder(this.metaplex, input);
  }

  /** {@inheritDoc updateCandyMachineV2Builder} */
  update(input: UpdateCandyMachineV2BuilderParams) {
    return updateCandyMachineV2Builder(this.metaplex, input);
  }
}
