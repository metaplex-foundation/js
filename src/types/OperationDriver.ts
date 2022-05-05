import { Task, TaskOptions } from '@/utils';
import { Driver } from './Driver';
import {
  OperationConstructor,
  Operation,
  KeyOfOperation,
  InputOfOperation,
  OutputOfOperation,
  OperationHandler,
} from './Operation';

export abstract class OperationDriver extends Driver {
  public abstract register<
    T extends Operation<K, I, O>,
    K extends string = KeyOfOperation<T>,
    I = InputOfOperation<T>,
    O = OutputOfOperation<T>
  >(
    operationConstructor: OperationConstructor<T, K, I, O>,
    operationHandler: OperationHandler<T, K, I, O>
  ): void;

  public abstract get<
    T extends Operation<K, I, O>,
    K extends string = KeyOfOperation<T>,
    I = InputOfOperation<T>,
    O = OutputOfOperation<T>
  >(operation: T): OperationHandler<T, K, I, O>;

  // Have to use "T | Operation<K, I, O>" for the type
  // of the subclasses to be inferred correctly.
  public abstract getTask<
    T extends Operation<K, I, O>,
    K extends string = KeyOfOperation<T>,
    I = InputOfOperation<T>,
    O = OutputOfOperation<T>
  >(operation: T | Operation<K, I, O>): Task<O>;

  // Have to use "T | Operation<K, I, O>" for the type
  // of the subclasses to be inferred correctly.
  public abstract execute<
    T extends Operation<K, I, O>,
    K extends string = KeyOfOperation<T>,
    I = InputOfOperation<T>,
    O = OutputOfOperation<T>
  >(operation: T | Operation<K, I, O>, options?: TaskOptions): Promise<O>;
}
