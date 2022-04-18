import { Metaplex } from '../Metaplex';
import { DisposableScope } from './useDisposable';
import { useLoader, Loader } from './useLoader';
import { Operation, InputOfOperation, OutputOfOperation, NameOfOperation } from './useOperation';

export type OperationHandler<
  T extends Operation<N, I, O>,
  N extends string = NameOfOperation<T>,
  I = InputOfOperation<T>,
  O = OutputOfOperation<T>
> = {
  __typename: 'OperationHandler';
  (metaplex: Metaplex, operation: T): Loader<O>;
};

export const useOperationHandler = <
  T extends Operation<N, I, O>,
  N extends string = NameOfOperation<T>,
  I = InputOfOperation<T>,
  O = OutputOfOperation<T>
>(
  callback: (metaplex: Metaplex, operation: T, scope: DisposableScope) => O | Promise<O>
) => {
  const getLoader = (metaplex: Metaplex, operation: T) =>
    useLoader((scope: DisposableScope) => {
      return callback(metaplex, operation, scope);
    });

  getLoader.__typename = 'OperationHandler';

  return getLoader as OperationHandler<T, N, I, O>;
};
