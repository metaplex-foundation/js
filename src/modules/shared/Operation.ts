export type OperationConstructor<I, O> = {
  new (input: I): Operation<I, O>;
};

export class Operation<I, O> {
  public input: I;

  constructor(input: I) {
    this.input = input;
  }
}
