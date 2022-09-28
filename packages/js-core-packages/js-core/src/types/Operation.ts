import { Metaplex } from '@/Metaplex';
import { DisposableScope } from '@/utils';

export type KeyOfOperation<T> = T extends Operation<infer N, unknown, unknown>
  ? N
  : never;
export type InputOfOperation<T> = T extends Operation<string, infer I, unknown>
  ? I
  : never;
export type OutputOfOperation<T> = T extends Operation<string, unknown, infer O>
  ? O
  : never;

export type Operation<K extends string, I, O> = {
  key: K;
  input: I;

  // This is necessary for type inference.
  __output?: O;
};

export type OperationConstructor<
  T extends Operation<K, I, O>,
  K extends string = KeyOfOperation<T>,
  I = InputOfOperation<T>,
  O = OutputOfOperation<T>
> = {
  key: string;
  (input: I): T;
};

export type OperationHandler<
  T extends Operation<K, I, O>,
  K extends string = KeyOfOperation<T>,
  I = InputOfOperation<T>,
  O = OutputOfOperation<T>
> = {
  handle: (
    operation: T,
    metaplex: Metaplex,
    scope: DisposableScope
  ) => O | Promise<O>;
};

/**
 * @group Operations
 * @category Constructors
 */
export const useOperation = <
  T extends Operation<K, I, O>,
  K extends string = KeyOfOperation<T>,
  I = InputOfOperation<T>,
  O = OutputOfOperation<T>
>(
  key: K
): OperationConstructor<T, K, I, O> => {
  const constructor = (input: I) => {
    return {
      key,
      input,
    } as T;
  };
  constructor.key = key;

  return constructor;
};
