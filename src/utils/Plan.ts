import BN from "bn.js";

type StepStatus =
  | 'pending'
  | 'running'
  | 'successful'
  | 'failed'
  | 'canceled';

interface Step {
  name: string;
  status: StepStatus;
  price: number | BN;
  hidden: boolean,
  optional: boolean,
  onError?: (error: unknown) => void;
}

type InputStep<From, To> = Pick<Step, 'name'> & Partial<Omit<Step, 'status'>> & {
  handler: (state: From) => Promise<To>;
};

type InputPlan<F, I> = Pick<Plan<F, I>, 'promise'> & Partial<Plan<F, I>>;

export class Plan<FinalState, InitialState = undefined> {
  public readonly promise: (state: InitialState) => Promise<FinalState>;
  public readonly steps: Step[];
  public readonly onChangeListeners: ((steps: Step[]) => void)[];
  public executing: boolean = false;
  public executed: boolean = false;

  private constructor (plan: InputPlan<FinalState, InitialState>) {
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
    const { handler } = step;
    const newStep: Step = {
      name: step.name,
      status: 'pending',
      price: step.price ?? 0,
      hidden: step.hidden ?? false,
      optional: step.optional ?? false,
      onError: step.onError,
    };

    const promise = async (initialState: InitialState) => {
      let state: FinalState;
      try {
        state = await this.promise(initialState);
      } catch (error) {
        this.changeStepStatus(newStep, 'canceled');
        throw error;
      }

      this.changeStepStatus(newStep, 'running');

      try {
        const newState = handler(state);
        this.changeStepStatus(newStep, 'successful');
        return newState;
      } catch (error) {
        this.changeStepStatus(newStep, 'failed');
        step.onError?.(error);
        if (step.optional) {
          // If a step is optional, it's final state should match its initial state.
          // Otherwise, steps cannot be composed.
          return state as unknown as NewState;
        } else {
          throw error;
        }
      }
    };

    return new Plan({
      promise,
      steps: [...this.steps, newStep],
      onChangeListeners: this.onChangeListeners,
    });
  }

  public onChange(listener: (steps: Step[]) => void) {
    this.onChangeListeners.push(listener);

    return this;
  }

  private notifyChange(): void {
    this.onChangeListeners.forEach(listener => listener(this.steps));
  }

  private changeStepStatus(step: Step, newStatus: StepStatus): void {
    step.status = newStatus;
    this.notifyChange();
  }

  public getSteps(): Step[] {
    return this.steps;
  }

  public getVisibleSteps(): Step[] {
    return this.steps.filter(step => !step.hidden);
  }

  public getTotalPrice(): BN {
    return this.steps.reduce((total, step) => total.add(new BN(step.price)), new BN(0));
  }

  public async execute(initialState?: InitialState): Promise<FinalState> {
    try {
      this.executing = true;
      this.executed = false;
      return await this.promise(initialState ?? undefined as unknown as InitialState);
    } finally {
      this.executing = false;
      this.executed = true;
    }
  }
}
