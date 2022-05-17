import test, { Test } from 'tape';
import { Plan } from '@/index';

test('it works with one trivial step', async (t: Test) => {
  // Given a plan with only one step that keep track of its execution.
  let executed = false;
  const plan = Plan.make().addStep({
    name: 'step1',
    handler: async () => {
      executed = true;
      return { some: 'state' };
    },
  });

  // When we execute the plan.
  const finalState = await plan.execute();

  // Then the step was executed and we got its final state.
  t.true(executed);
  t.same(finalState, { some: 'state' });

  // And both the plan and the step are marked as successfully executed.
  t.ok(plan.executed);
  t.equal(plan.getSteps()[0].status, 'successful');
});

test('it support another signature for adding steps', async (t: Test) => {
  // Given we add steps using the alternative signature.
  const plan = Plan.make().addStep('step1', async () => 42, {
    optional: true,
    hidden: true,
  });

  // When we execute the plan.
  const finalState = await plan.execute();

  // Then we got the right value.
  t.same(finalState, 42);

  // And all step information was stored properly.
  const step = plan.getSteps()[0];
  t.equal(step.name, 'step1');
  t.equal(step.status, 'successful');
  t.true(step.optional);
  t.true(step.hidden);
});

test('it may require some initial state', async (t: Test) => {
  // Given a plan with only one step that keep track of its execution.
  const plan = Plan.make<{ counter: number }>().addStep({
    name: 'step1',
    handler: async ({ counter }) => ({ isEven: counter % 2 === 0 }),
  });

  // When we execute the plan without initial state.
  const finalState = await plan.execute({ counter: 11 });

  // Then the step was executed and we got its final state.
  t.same(finalState, { isEven: false });
});

test('it works with multiple steps', async (t: Test) => {
  // Given a plan with multiple steps that push their name to an array.
  let executedSteps: string[] = [];
  const plan = Plan.make()
    .addStep({
      name: 'step1',
      handler: async () => executedSteps.push('step1'),
    })
    .addStep({
      name: 'step2',
      handler: async () => executedSteps.push('step2'),
    });

  // When we execute the plan.
  await plan.execute();

  // Then the steps were executed in the right order.
  t.same(executedSteps, ['step1', 'step2']);
});

test('it keeps track of an execution state', async (t: Test) => {
  // Given a plan with an initial state altered by its steps.
  const plan = Plan.make<{ step1Executed: boolean; step2Executed: boolean }>()
    .addStep({
      name: 'step1',
      handler: async (state) => ({ ...state, step1Executed: true }),
    })
    .addStep({
      name: 'step2',
      handler: async (state) => ({ ...state, step2Executed: true }),
    });

  // When we execute the plan and retrieve the state.
  const finalState = await plan.execute({
    step1Executed: false,
    step2Executed: false,
  });

  // Then the final state has successfully been altered.
  t.same(finalState, { step1Executed: true, step2Executed: true });
});

test('it can grow its execution state as we add more steps', async (t: Test) => {
  // Given a plan with only one step that provides some state.
  const plan = Plan.make().addStep({
    name: 'step1',
    handler: async () => ({ step1Executed: true }),
  });

  // And a second step that adds some more state to the plan.
  const newPlan = plan.addStep({
    name: 'step2',
    handler: async (state) => ({ ...state, step2Executed: true }),
  });

  // When we execute the plan and retrieve the state.
  const finalState = await newPlan.execute();

  // Then the final state contains data from both steps.
  t.same(finalState, { step1Executed: true, step2Executed: true });
});

test('it can prepend steps to the plan', async (t: Test) => {
  // Given a plan with only one step that accepts a counter a tells us if it's even.
  const plan = Plan.make<{ counter: number }>().addStep({
    name: 'step1',
    handler: async ({ counter }) => ({ isEven: counter % 2 === 0 }),
  });

  // And a prepended step that convert a sentence into a counter.
  const newPlan = plan.prependStep<{ sentence: string }>({
    name: 'step0',
    handler: async ({ sentence }) => ({ counter: sentence.length }),
  });

  // When we execute the plan and retrieve the state.
  const finalState = await newPlan.execute({ sentence: 'Hello world!' });

  // Then the final state contains data from both steps.
  t.same(finalState, { isEven: true });

  // And both steps executed in the right order.
  t.same(
    newPlan.getSteps().map((s) => s.name),
    ['step0', 'step1']
  );
  t.same(
    newPlan.getSteps().map((s) => s.status),
    ['successful', 'successful']
  );
});

test('it can listen to step changes', async (t: Test) => {
  // Given a plan with one step that listens for changes.
  const step1Changes: string[] = [];
  const plan = Plan.make()
    .addStep('step1', async () => 42)
    .onChange((step) => {
      step1Changes.push(step.status);
    });

  // When we execute the plan.
  await plan.execute();

  // Then all changes were recorded.
  t.same(step1Changes, ['running', 'successful']);
});

test('it can listen to all step changes at once', async (t: Test) => {
  // Given a plan with two steps that listen for changes.
  const history: { [key: string]: string }[] = [];
  const plan = Plan.make()
    .addStep('step1', async () => 42)
    .addStep('step2', async (n) => n * 2)
    .onChange((step, plan) => {
      const acc = { changed: step.name };
      history.push(
        plan.steps.reduce(
          (acc, step) => ({ ...acc, [step.name]: step.status }),
          acc
        )
      );
    });

  // When we execute the plan.
  await plan.execute();

  // Then all changes were recorded.
  t.same(history, [
    {
      step1: 'running',
      step2: 'pending',
      changed: 'step1',
    },
    {
      step1: 'successful',
      step2: 'pending',
      changed: 'step1',
    },
    {
      step1: 'successful',
      step2: 'running',
      changed: 'step2',
    },
    {
      step1: 'successful',
      step2: 'successful',
      changed: 'step2',
    },
  ]);
});

test('it keeps track of its execution state', async (t: Test) => {
  // Given a plan with a step that ensure the plan is executing.
  const plan = Plan.make().addStep('step1', async (_, plan) => {
    t.true(plan.executing);
    t.false(plan.executed);
    t.false(plan.failed);
  });

  // And that plan hasn't executed yet.
  t.false(plan.executing);
  t.false(plan.executed);
  t.false(plan.failed);

  // When we execute the plan.
  await plan.execute();

  // Then it is marked as executed.
  t.false(plan.executing);
  t.true(plan.executed);
  t.false(plan.failed);
});

test('it keeps track of its failed state', async (t: Test) => {
  // Given a plan that fails.
  const plan = Plan.make().addStep('step1', async () => {
    throw new Error();
  });

  // And that hasn't executed yet.
  t.false(plan.executing);
  t.false(plan.executed);
  t.false(plan.failed);

  // When we execute the plan.
  try {
    await plan.execute();
  } catch (error) {
    // Then it is marked as failed.
    t.false(plan.executing);
    t.true(plan.executed);
    t.true(plan.failed);
    return;
  }

  // We should never get here.
  t.fail('plan should have failed');
});
