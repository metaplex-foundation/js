import type EventEmitter from 'eventemitter3';
import EventEmitterPackage from 'eventemitter3';

export type StepStatus =
  | 'pending'
  | 'running'
  | 'successful'
  | 'failed'
  | 'canceled';

export interface Step {
  name: string;
  status: StepStatus;
  hidden: boolean;
  optional: boolean;
  onError?: (error: unknown) => void;
}

export type InputStepHandler<From, To> = (
  state: From,
  plan: Plan<any, any>
) => Promise<To>;

export type InputStepOptions = Partial<Omit<Step, 'name' | 'status'>>;

export type InputStep<From, To> = Pick<Step, 'name'> &
  InputStepOptions & {
    handler: InputStepHandler<From, To>;
  };

type InputPlan<I, O> = Pick<Plan<I, O>, 'promise'> & Partial<Plan<I, O>>;

/** @deprecated */
export class Plan<I, O> {
  public readonly promise: (state: I, plan: Plan<any, any>) => Promise<O>;
  public readonly steps: Step[];
  public readonly eventEmitter: EventEmitter;
  public executing: boolean = false;
  public executed: boolean = false;
  public failed: boolean = false;

  private constructor(plan: InputPlan<I, O>) {
    this.promise = plan.promise;
    this.steps = plan.steps ?? [];
    this.eventEmitter =
      plan.eventEmitter ?? new EventEmitterPackage.EventEmitter();
  }

  public static make<T = undefined>(): Plan<T, T> {
    return new Plan<T, T>({
      promise: async (initialState) => initialState,
    });
  }

  public addStep<T>(step: InputStep<O, T>): Plan<I, T>;
  public addStep<T>(
    name: string,
    handler: InputStepHandler<O, T>,
    options?: InputStepOptions
  ): Plan<I, T>;
  public addStep<T>(
    stepOrName: InputStep<O, T> | string,
    stepHandler?: InputStepHandler<O, T>,
    stepOptions?: InputStepOptions
  ): Plan<I, T> {
    const { newStep, handler } = Plan.parseInputStep(
      stepOrName,
      stepHandler,
      stepOptions
    );

    const promise = async (initialState: I, plan: Plan<any, any>) => {
      let state: O;
      try {
        state = await this.promise(initialState, plan);
      } catch (error) {
        Plan.changeStepStatus(plan, newStep, 'canceled');
        throw error;
      }

      return Plan.processStep(plan, state, newStep, handler);
    };

    return new Plan({
      promise,
      steps: [...this.steps, newStep],
      eventEmitter: this.eventEmitter,
    });
  }

  public prependStep<T>(step: InputStep<T, I>): Plan<T, O>;
  public prependStep<T>(
    name: string,
    handler: InputStepHandler<T, I>,
    options?: InputStepOptions
  ): Plan<T, O>;
  public prependStep<T>(
    stepOrName: InputStep<T, I> | string,
    stepHandler?: InputStepHandler<T, I>,
    stepOptions?: InputStepOptions
  ): Plan<T, O> {
    const { newStep, handler } = Plan.parseInputStep(
      stepOrName,
      stepHandler,
      stepOptions
    );

    const promise = async (newInitialState: T, plan: Plan<any, any>) => {
      let initialState: I;
      try {
        initialState = await Plan.processStep(
          plan,
          newInitialState,
          newStep,
          handler
        );
      } catch (error) {
        this.steps.forEach((step) =>
          Plan.changeStepStatus(plan, step, 'canceled')
        );
        throw error;
      }

      return this.promise(initialState, plan);
    };

    return new Plan<T, O>({
      promise,
      steps: [newStep, ...this.steps],
      eventEmitter: this.eventEmitter,
    });
  }

  public onChange(listener: (step: Step, plan: Plan<any, any>) => void) {
    this.eventEmitter.addListener('change', listener);

    return this;
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
      this.failed = false;
      const state = initialState ?? (undefined as unknown as I);
      return await this.promise(state, this);
    } catch (error) {
      this.failed = true;
      throw error;
    } finally {
      this.executing = false;
      this.executed = true;
    }
  }

  private static parseInputStep<From, To>(
    stepOrName: InputStep<From, To> | string,
    stepHandler?: InputStepHandler<From, To>,
    stepOptions?: InputStepOptions
  ) {
    let inputStep: InputStep<From, To>;

    if (typeof stepOrName === 'string') {
      if (!stepHandler) {
        throw new TypeError('Missing step handler');
      }
      inputStep = {
        name: stepOrName,
        handler: stepHandler,
        ...stepOptions,
      };
    } else {
      inputStep = stepOrName;
    }

    const { handler } = inputStep;
    const newStep: Step = {
      name: inputStep.name,
      status: 'pending',
      hidden: inputStep.hidden ?? false,
      optional: inputStep.optional ?? false,
      onError: inputStep.onError,
    };

    return { newStep, handler };
  }

  private static async processStep<From, To>(
    plan: Plan<any, any>,
    from: From,
    step: Step,
    handler: (from: From, plan: Plan<any, any>) => Promise<To>
  ): Promise<To> {
    this.changeStepStatus(plan, step, 'running');

    try {
      const to = await handler(from, plan);
      this.changeStepStatus(plan, step, 'successful');
      return to;
    } catch (error) {
      this.changeStepStatus(plan, step, 'failed');
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

  private static notifyChange(plan: Plan<any, any>, step: Step): void {
    plan.eventEmitter.emit('change', step, plan);
  }

  private static changeStepStatus(
    plan: Plan<any, any>,
    step: Step,
    newStatus: StepStatus
  ): void {
    step.status = newStatus;
    this.notifyChange(plan, step);
  }
}
