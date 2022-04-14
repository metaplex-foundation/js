import { Metaplex } from '../Metaplex.js';

export abstract class Driver {
  protected readonly metaplex: Metaplex;

  constructor(metaplex: Metaplex) {
    this.metaplex = metaplex;
  }
}
