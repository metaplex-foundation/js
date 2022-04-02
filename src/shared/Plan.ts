type StepStatus = 'pending' | 'running' | 'successful' | 'failed' | 'canceled';

interface Step {
  name: string;
  status: StepStatus;
  hidden: boolean;
  optional: boolean;
  onError?: (error: unknown) => void;
}

export type InputStep<From, To> = Pick<Step, 'name'> &
  Partial<Omit<Step, 'status'>> & {
    handler: (state: From) => Promise<To>;
  };

type InputPlan<I, O> = Pick<Plan<I, O>, 'promise'> & Partial<Plan<I, O>>;

export class Plan<I, O> {
  public readonly promise: (state: I) => Promise<O>;
  public readonly steps: Step[];
  public readonly onChangeListeners: ((steps: Step[]) => void)[];
  public executing: boolean = false;
  public executed: boolean = false;

  private constructor(plan: InputPlan<I, O>) {
    this.promise = plan.promise;
    this.steps = plan.steps ?? [];
    this.onChangeListeners = plan.onChangeListeners ?? [];
  }

  public static make<T = undefined>(): Plan<T, T> {
    return new Plan<T, T>({
      promise: async (initialState) => initialState,
    });
  }

  public addStep<T>(step: InputStep<O, T>): Plan<I, T> {
    const { newStep, handler } = this.parseInputStep(step);

    const promise = async (initialState: I) => {
      let state: O;
      try {
        state = await this.promise(initialState);
      } catch (error) {
        this.changeStepStatus(newStep, 'canceled');
        throw error;
      }

      return this.processStep(state, newStep, handler);
    };

    return new Plan({
      promise,
      steps: [...this.steps, newStep],
      onChangeListeners: this.onChangeListeners,
    });
  }

  prependStep<T>(step: InputStep<T, I>): Plan<T, O> {
    const { newStep, handler } = this.parseInputStep(step);

    const promise = async (newInitialState: T) => {
      let initialState: I;
      try {
        initialState = await this.processStep(newInitialState, newStep, handler);
      } catch (error) {
        this.steps.forEach((step) => this.changeStepStatus(step, 'canceled'));
        throw error;
      }

      return this.promise(initialState);
    };

    return new Plan<T, O>({
      promise,
      steps: [newStep, ...this.steps],
      onChangeListeners: this.onChangeListeners,
    });
  }

  private parseInputStep<From, To>(step: InputStep<From, To>) {
    const { handler } = step;
    const newStep: Step = {
      name: step.name,
      status: 'pending',
      hidden: step.hidden ?? false,
      optional: step.optional ?? false,
      onError: step.onError,
    };

    return { newStep, handler };
  }

  private async processStep<From, To>(
    from: From,
    step: Step,
    handler: (from: From) => Promise<To>
  ): Promise<To> {
    this.changeStepStatus(step, 'running');

    try {
      const to = await handler(from);
      this.changeStepStatus(step, 'successful');
      return to;
    } catch (error) {
      this.changeStepStatus(step, 'failed');
      step.onError?.(error);
      if (step.optional) {
        // If a step is optional, it's destination state should match
        // the source state. Otherwise, steps cannot be composed.
        return from as unknown as To;
      } else {
        throw error;
      }
    }
  }

  public onChange(listener: (steps: Step[]) => void) {
    this.onChangeListeners.push(listener);

    return this;
  }

  private notifyChange(): void {
    this.onChangeListeners.forEach((listener) => listener(this.steps));
  }

  private changeStepStatus(step: Step, newStatus: StepStatus): void {
    step.status = newStatus;
    this.notifyChange();
  }

  public getSteps(): Step[] {
    return this.steps;
  }

  public getVisibleSteps(): Step[] {
    return this.steps.filter((step) => !step.hidden);
  }

  public async execute(initialState?: I): Promise<O> {
    try {
      this.executing = true;
      this.executed = false;
      return await this.promise(initialState ?? (undefined as unknown as I));
    } finally {
      this.executing = false;
      this.executed = true;
    }
  }
}
