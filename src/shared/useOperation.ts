export type NameOfOperation<T> = T extends Operation<infer N, unknown, unknown> ? N : never;
export type InputOfOperation<T> = T extends Operation<string, infer I, unknown> ? I : never;
export type OutputOfOperation<T> = T extends Operation<string, unknown, infer O> ? O : never;

export type Operation<N extends string, I, O> = {
  __typename: 'Operation';
  key: N;
  input: I;

  // This is necessary for type inference.
  __output?: O;
};

export type OperationConstructor<
  T extends Operation<N, I, O>,
  N extends string = NameOfOperation<T>,
  I = InputOfOperation<T>,
  O = OutputOfOperation<T>
> = {
  key: string;
  (input: I): T;
};

export const useOperation = <
  T extends Operation<N, I, O>,
  N extends string = NameOfOperation<T>,
  I = InputOfOperation<T>,
  O = OutputOfOperation<T>
>(
  key: N
): OperationConstructor<T, N, I, O> => {
  const constructor = (input: I) => {
    return {
      __typename: 'Operation',
      key,
      input,
    } as T;
  };
  constructor.key = key;

  return constructor;
};
