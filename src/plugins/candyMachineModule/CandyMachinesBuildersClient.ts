import type { Metaplex } from '@/Metaplex';
import {
  createCandyMachineBuilder,
  CreateCandyMachineBuilderParams,
} from './createCandyMachine';
import {
  insertItemsToCandyMachineBuilder,
  InsertItemsToCandyMachineBuilderParams,
} from './insertItemsToCandyMachine';
import {
  mintCandyMachineBuilder,
  MintCandyMachineBuilderParams,
} from './mintCandyMachine';
import {
  updateCandyMachineBuilder,
  UpdateCandyMachineBuilderParams,
} from './updateCandyMachine';

export class CandyMachinesBuildersClient {
  constructor(protected readonly metaplex: Metaplex) {}

  create(input: CreateCandyMachineBuilderParams) {
    return createCandyMachineBuilder(this.metaplex, input);
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
