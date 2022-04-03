export type OperationConstructor<I, O> = {
  new (input: I): Operation<I, O>;
};

export type InputOfOperation<T> = T extends Operation<infer I, unknown> ? I : never;

export type OutputOfOperation<T> = T extends Operation<unknown, infer O> ? O : never;

export class Operation<I, O> {
  public input: I;

  // This is necessary for type inference.
  output?: O;

  constructor(input: I) {
    this.input = input;
  }
}
