import { Metaplex } from '@/Metaplex';

export type DriverType = {};

export type DriverAware<T extends DriverType> = {
  driver: () => T;
  setDriver: (newDriver: T) => void;
};

export abstract class Driver {
  protected readonly metaplex: Metaplex;

  constructor(metaplex: Metaplex) {
    this.metaplex = metaplex;
  }
}
