import { Metaplex } from '../Metaplex.js';

export abstract class ModuleClient {
  protected readonly metaplex: Metaplex;

  constructor(metaplex: Metaplex) {
    this.metaplex = metaplex;
  }
}
