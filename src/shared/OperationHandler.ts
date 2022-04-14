import { Metaplex } from '../Metaplex.js';
import { InputOfOperation, Operation, OutputOfOperation } from './Operation.js';

export type OperationHandlerConstructor<
  T extends Operation<I, O>,
  I = InputOfOperation<T>,
  O = OutputOfOperation<T>
> = {
  new (metaplex: Metaplex): OperationHandler<T, I, O>;
};

export abstract class OperationHandler<
  T extends Operation<I, O>,
  I = InputOfOperation<T>,
  O = OutputOfOperation<T>
> {
  public metaplex: Metaplex;

  constructor(metaplex: Metaplex) {
    this.metaplex = metaplex;
  }

  public abstract handle(operation: T): Promise<O>;
}
