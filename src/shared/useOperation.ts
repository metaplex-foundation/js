export type NewNameOfOperation<T> = T extends NewOperation<infer N, unknown, unknown> ? N : never;
export type NewInputOfOperation<T> = T extends NewOperation<string, infer I, unknown> ? I : never;
export type NewOutputOfOperation<T> = T extends NewOperation<string, unknown, infer O> ? O : never;

export type NewOperation<N extends string, I, O> = {
  __typename: 'Operation';
  name: N;
  input: I;

  // This is necessary for type inference.
  __output?: O;
};

export type NewOperationConstructor<
  T extends NewOperation<N, I, O>,
  N extends string = NewNameOfOperation<T>,
  I = NewInputOfOperation<T>,
  O = NewOutputOfOperation<T>
> = {
  name: string;
  (input: I): T;
};

export const useOperation = <
  T extends NewOperation<N, I, O>,
  N extends string = NewNameOfOperation<T>,
  I = NewInputOfOperation<T>,
  O = NewOutputOfOperation<T>
>(
  name: N
): NewOperationConstructor<T, N, I, O> => {
  const constructor = (input: I) => {
    return {
      name,
      input,
    } as T;
  };
  constructor.name = name;

  return constructor;
};
