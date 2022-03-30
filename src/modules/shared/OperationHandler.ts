import { ConfirmOptions } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Plan } from '@/utils';
import { InputOfOperation, Operation, OutputOfOperation } from './Operation';

export type OperationHandlerConstructor<
  T extends Operation<I, O>,
  I = InputOfOperation<T>,
  O = OutputOfOperation<T>
> = {
  new (metaplex: Metaplex, confirmOptions?: ConfirmOptions): OperationHandler<T, I, O>;
};

export abstract class OperationHandler<
  T extends Operation<I, O>,
  I = InputOfOperation<T>,
  O = OutputOfOperation<T>
> {
  public metaplex: Metaplex;
  public confirmOptions?: ConfirmOptions;

  constructor(metaplex: Metaplex, confirmOptions?: ConfirmOptions) {
    this.metaplex = metaplex;
    this.confirmOptions = confirmOptions;
  }

  public abstract handle(operation: T): Promise<Plan<I, O>>;
}
