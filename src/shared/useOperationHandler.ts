import { Metaplex } from '../Metaplex';
import { DisposableScope } from './useDisposable';
import { useLoader, Loader } from './useLoader';
import { NewOperation, NewInputOfOperation, NewOutputOfOperation } from './useOperation';

export type NewOperationHandler<
  T extends NewOperation<I, O>,
  I = NewInputOfOperation<T>,
  O = NewOutputOfOperation<T>
> = {
  __typename: 'OperationHandler';
  name: string;
  execute: (metaplex: Metaplex, operation: T) => Loader<O>;
};

export const useOperationHandler = <
  T extends NewOperation<I, O>,
  I = NewInputOfOperation<T>,
  O = NewOutputOfOperation<T>
>(
  name: string,
  callback: (metaplex: Metaplex, operation: T, scope: DisposableScope) => O | Promise<O>
) => {
  const execute = (metaplex: Metaplex, operation: T) =>
    useLoader((scope: DisposableScope) => {
      return callback(metaplex, operation, scope);
    });

  return <NewOperationHandler<T, I, O>>{
    name,
    execute,
  };
};
