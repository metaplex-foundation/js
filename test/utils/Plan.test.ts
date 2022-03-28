import test, { Test } from 'tape';
import { Plan } from '../../src';

test('it works with one trivial step', async (t: Test) => {
  // Given a plan with only one step that keep track of its execution.
  let executed = false;
  const plan = Plan.make().addStep({
    name: 'step1',
    handler: async () => executed = true,
  });

  // When we execute the plan.
  await plan.execute();

  // Then the step was executed.
  t.true(executed);
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
