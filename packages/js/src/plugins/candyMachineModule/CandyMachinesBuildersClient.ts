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

export class CandyMachinesBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  create(input: CreateCandyMachineBuilderParams) {
    return createCandyMachineBuilder(this.metaplex, input);
  }

  delete(input: DeleteCandyMachineBuilderParams) {
    return deleteCandyMachineBuilder(this.metaplex, input);
  }

  insertItems(input: InsertItemsToCandyMachineBuilderParams) {
    return insertItemsToCandyMachineBuilder(input);
  }

  mint(input: MintCandyMachineBuilderParams) {
    return mintCandyMachineBuilder(this.metaplex, input);
  }

  update(input: UpdateCandyMachineBuilderParams) {
    return updateCandyMachineBuilder(this.metaplex, input);
  }
}
