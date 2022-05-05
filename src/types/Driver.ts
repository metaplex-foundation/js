import { Metaplex } from '@/Metaplex';

export abstract class Driver {
  protected readonly metaplex: Metaplex;

  constructor(metaplex: Metaplex) {
    this.metaplex = metaplex;
  }
}
