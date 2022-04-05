import EventEmitter from 'eventemitter3';

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
  public readonly promise: (state: I, steps: Step[]) => Promise<O>;
  public readonly steps: Step[];
  public readonly eventEmitter: EventEmitter;
  public executing: boolean = false;
  public executed: boolean = false;

  private constructor(plan: InputPlan<I, O>) {
    this.promise = plan.promise;
    this.steps = plan.steps ?? [];
    this.eventEmitter = plan.eventEmitter ?? new EventEmitter();
  }

  public static make<T = undefined>(): Plan<T, T> {
    return new Plan<T, T>({
      promise: async (initialState) => initialState,
    });
  }

  public addStep<T>(step: InputStep<O, T>): Plan<I, T> {
    const { newStep, handler } = this.parseInputStep(step);

    const promise = async (initialState: I, steps: Step[]) => {
      let state: O;
      try {
        state = await this.promise(initialState, steps);
      } catch (error) {
        this.changeStepStatus(steps, newStep, 'canceled');
        throw error;
      }

      return this.processStep(steps, state, newStep, handler);
    };

    return new Plan({
      promise,
      steps: [...this.steps, newStep],
      eventEmitter: this.eventEmitter,
    });
  }

  prependStep<T>(step: InputStep<T, I>): Plan<T, O> {
    const { newStep, handler } = this.parseInputStep(step);

    const promise = async (newInitialState: T, steps: Step[]) => {
      let initialState: I;
      try {
        initialState = await this.processStep(steps, newInitialState, newStep, handler);
      } catch (error) {
        this.steps.forEach((step) => this.changeStepStatus(steps, step, 'canceled'));
        throw error;
      }

      return this.promise(initialState, steps);
    };

    return new Plan<T, O>({
      promise,
      steps: [newStep, ...this.steps],
      eventEmitter: this.eventEmitter,
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
    steps: Step[],
    from: From,
    step: Step,
    handler: (from: From) => Promise<To>
  ): Promise<To> {
    this.changeStepStatus(steps, step, 'running');

    try {
      const to = await handler(from);
      this.changeStepStatus(steps, step, 'successful');
      return to;
    } catch (error) {
      this.changeStepStatus(steps, step, 'failed');
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

  public onChange(listener: (step: Step, steps: Step[]) => void) {
    this.eventEmitter.addListener('change', listener);

    return this;
  }

  private notifyChange(step: Step, steps: Step[]): void {
    this.eventEmitter.emit('change', step, steps);
  }

  private changeStepStatus(steps: Step[], step: Step, newStatus: StepStatus): void {
    step.status = newStatus;
    this.notifyChange(step, steps);
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
      const state = initialState ?? (undefined as unknown as I);
      return await this.promise(state, this.steps);
    } finally {
      this.executing = false;
      this.executed = true;
    }
  }
}
