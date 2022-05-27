import { Metaplex } from '@/Metaplex';

export type HasDriver<T> = {
  driver: () => T;
  setDriver: (newDriver: T) => void;
};

/** @deprecated */
export abstract class Driver {
  protected readonly metaplex: Metaplex;

  constructor(metaplex: Metaplex) {
    this.metaplex = metaplex;
  }
}
