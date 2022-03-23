import { Metaplex } from '@/Metaplex';

export abstract class ModuleClient {
  protected readonly metaplex: Metaplex;

  constructor(metaplex: Metaplex) {
    this.metaplex = metaplex;
  }
}
