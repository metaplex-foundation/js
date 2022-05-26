import { Metaplex } from '@/Metaplex';
import { MetaplexAware } from './MetaplexAware';

export type DriverType = MetaplexAware;

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
