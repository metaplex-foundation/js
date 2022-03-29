import BN from "bn.js";

type StepStatus =
  | 'pending'
  | 'running'
  | 'successful'
  | 'failed'
  | 'canceled';

interface Step<T> {
  name: string;
  status: StepStatus;
  price: number | BN;
  hidden: boolean,
  optional: boolean,
  handler: (state: T) => Promise<any>;
  onError?: (error: unknown) => void;
}

type InputStep<T> = Pick<Step<T>, 'name' | 'handler'> & Partial<Omit<Step<T>, 'status'>>;

export class Plan<T extends object = {}> {
  public readonly steps: Step<T>[];
  public readonly onChangeListeners: ((steps: Step<any>[]) => void)[];
  public state: T;
  public executed: boolean = false;
  public canceled: boolean = false;

  public constructor (plan: Partial<Plan<T>> = {}) {
    this.steps = plan.steps ?? [];
    this.onChangeListeners = plan.onChangeListeners ?? [];
    this.state = plan.state ?? {} as T;
  }

  public static make<T extends object = {}>(state?: T): Plan<T> {
    return new Plan<T>({ state });
  }

  public addStep<U extends object = {}>(step: InputStep<T & U>): Plan<T & U> {
    const newStep: Step<T & U> = {
      status: 'pending',
      price: 0,
      hidden: false,
      optional: false,
      ...step,
    };

    return new Plan({
      steps: [...this.steps, newStep],
      onChangeListeners: this.onChangeListeners,
      state: this.state as T & U,
    });
  }

  public merge<U extends object = {}>(that: Plan<U>): Plan<T & U> {
    return new Plan<T & U>({
      steps: [...this.steps, ...that.steps],
      onChangeListeners: [...this.onChangeListeners, ...that.onChangeListeners],
      state: { ...this.state, ...that.state },
    });
  }

  public onChange(listener: (steps: Step<any>[]) => void) {
    this.onChangeListeners.push(listener);

    return this;
  }

  private notifyChange(): void {
    this.onChangeListeners.forEach(listener => listener(this.steps));
  }

  public getSteps(): Step<any>[] {
    return this.steps;
  }

  public getVisibleSteps(): Step<any>[] {
    return this.steps.filter(step => !step.hidden);
  }

  public getTotalPrice(): BN {
    return this.steps.reduce((total, step) => total.add(new BN(step.price)), new BN(0));
  }

  public async execute(): Promise<T> {
    const steps = this.steps;
    this.executed = true;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      if (this.canceled) {
        step.status = 'canceled';
        this.notifyChange();
        continue;
      }

      step.status = 'running';
      this.notifyChange();

      try {
        await step.handler(this.state);
        step.status = 'successful';
        this.notifyChange();
      } catch (error) {
        step.status = 'failed';
        this.notifyChange();
        step.onError?.(error);
        if (!step.optional) {
          this.canceled = true;
        }
      }
    }

    return this.state;
  }
}
