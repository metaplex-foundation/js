import test, { Test } from 'tape';
import { Plan } from '../../src';

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

test('it works with multiple steps', async (t: Test) => {
  // Given a plan with multiple steps that push their name to an array.
  let executedSteps = [];
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
  const initialState = { step1Executed: false, step2Executed: false };
  const plan = Plan.make(initialState)
    .addStep({
      name: 'step1',
      handler: async (state) => ({ ...state, step1Executed: true }),
    })
    .addStep({
      name: 'step2',
      handler: async (state) => ({ ...state, step2Executed: true }),
    });

  // When we execute the plan and retrieve the state.
  const finalState = await plan.execute();

  // Then the final state has successfully been altered.
  t.same(finalState, { step1Executed: true, step2Executed: true });
});

test('it can grow its execution state as we add more steps', async (t: Test) => {
  // Given a plan with only one step that provides some state.
  const plan = Plan.make().addStep({
    name: 'step1',
    handler: async () => ({ step1Executed: true }),
  })

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
