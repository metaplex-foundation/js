import BN from 'bn.js';

type StepStatus = 'pending' | 'running' | 'successful' | 'failed' | 'canceled';

interface Step {
  name: string;
  status: StepStatus;
  price: number | BN;
  hidden: boolean;
  optional: boolean;
  onError?: (error: unknown) => void;
}

export type InputStep<From, To> = Pick<Step, 'name'> &
  Partial<Omit<Step, 'status'>> & {
    handler: (state: From) => Promise<To>;
  };

type InputPlan<F, I> = Pick<Plan<F, I>, 'promise'> & Partial<Plan<F, I>>;

export class Plan<FinalState, InitialState = undefined> {
  public readonly promise: (state: InitialState) => Promise<FinalState>;
  public readonly steps: Step[];
  public readonly onChangeListeners: ((steps: Step[]) => void)[];
  public executing: boolean = false;
  public executed: boolean = false;

  private constructor(plan: InputPlan<FinalState, InitialState>) {
    this.promise = plan.promise;
    this.steps = plan.steps ?? [];
    this.onChangeListeners = plan.onChangeListeners ?? [];
  }

  public static make<T = undefined>(): Plan<T, T> {
    return new Plan<T, T>({
      promise: async (initialState) => initialState,
    });
  }

  public addStep<NewState>(step: InputStep<FinalState, NewState>): Plan<NewState, InitialState> {
    const { newStep, handler } = this.parseInputStep(step);

    const promise = async (initialState: InitialState) => {
      let state: FinalState;
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

  prependStep<NewInitialState>(
    step: InputStep<NewInitialState, InitialState>
  ): Plan<FinalState, NewInitialState> {
    const { newStep, handler } = this.parseInputStep(step);

    const promise = async (newInitialState: NewInitialState) => {
      let initialState: InitialState;
      try {
        initialState = await this.processStep(newInitialState, newStep, handler);
      } catch (error) {
        this.steps.forEach((step) => this.changeStepStatus(step, 'canceled'));
        throw error;
      }

      return this.promise(initialState);
    };

    return new Plan<FinalState, NewInitialState>({
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
      price: step.price ?? 0,
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

  public getTotalPrice(): BN {
    return this.steps.reduce((total, step) => total.add(new BN(step.price)), new BN(0));
  }

  public async execute(initialState?: InitialState): Promise<FinalState> {
    try {
      this.executing = true;
      this.executed = false;
      return await this.promise(initialState ?? (undefined as unknown as InitialState));
    } finally {
      this.executing = false;
      this.executed = true;
    }
  }
}
