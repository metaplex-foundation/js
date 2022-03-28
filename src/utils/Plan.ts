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
  handler: () => Promise<any>;
  onError?: (error: unknown) => void;
}

type InputStep = Pick<Step, 'name' | 'handler'> & Partial<Omit<Step, 'status'>>;

export class Plan {
  public readonly steps: Step[] = [];
  public onChangeListeners: ((steps: Step[]) => void)[] = [];

  public static make(): Plan {
    return new Plan();
  }

  public addStep(step: InputStep) {
    this.steps.push({
      status: 'pending',
      price: 0,
      hidden: false,
      optional: false,
      ...step,
    });

    return this;
  }

  public onChange(listener: (steps: Step[]) => void) {
    this.onChangeListeners.push(listener);

    return this;
  }

  private notifyChange(): void {
    this.onChangeListeners.forEach(listener => listener(this.steps));
  }

  public getSteps(): Step[] {
    return this.steps;
  }

  public getVisibleSteps(): Step[] {
    return this.steps.filter(step => !step.hidden);
  }

  public merge(that: Plan) {
    this.steps.push(...that.steps);
    this.onChangeListeners.push(...that.onChangeListeners);

    return this;
  }

  public async execute(): Promise<void> {
    const steps = this.steps;
    let canceled = false;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      if (canceled) {
        step.status = 'canceled';
        this.notifyChange();
        continue;
      }

      step.status = 'running';
      this.notifyChange();

      try {
        await step.handler();
        step.status = 'successful';
        this.notifyChange();
      } catch (error) {
        step.status = 'failed';
        this.notifyChange();
        step.onError?.(error);
        if (!step.optional) {
          canceled = true;
        }
      }
    }
  }
}
