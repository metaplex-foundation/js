export type NewInputOfOperation<T> = T extends NewOperation<infer I, unknown> ? I : never;

export type NewOutputOfOperation<T> = T extends NewOperation<unknown, infer O> ? O : never;

export type NewOperation<I, O> = {
  __typename: 'Operation';
  name: string;
  input: I;

  // This is necessary for type inference.
  __output?: O;
};

export type NewOperationConstructor<I, O> = {
  name: string;
  (input: I): NewOperation<I, O>;
};

export const useOperation = <I, O>(name: string): NewOperationConstructor<I, O> => {
  const constructor = (input: I) => {
    return <NewOperation<I, O>>{
      name,
      input,
    };
  };
  constructor.name = name;

  return constructor;
};
