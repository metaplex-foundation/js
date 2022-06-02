import test, { Test } from 'tape';
import AbortController from 'abort-controller';
import { Task } from '@/index';

test('[Task] it can succeed with an asynchronous callback', async (t: Test) => {
  // Given a "pending" async task that returns a number.
  const task = new Task(async () => {
    t.equal(task.getStatus(), 'running');
    return 42;
  });
  t.equal(task.getResult(), undefined);
  t.equal(task.getStatus(), 'pending');

  // When we run the task.
  await task.run();

  // Then we get the right result and it was marked as successful.
  t.equal(task.getResult(), 42);
  t.equal(task.getStatus(), 'successful');
  t.equal(task.getError(), undefined);
});

test('[Task] it can succeed with an synchronous callback', async (t: Test) => {
  // Given a "pending" task that returns a number.
  const task = new Task(() => {
    t.equal(task.getStatus(), 'running');
    return 42;
  });
  t.equal(task.getResult(), undefined);
  t.equal(task.getStatus(), 'pending');

  // When we run the task.
  await task.run();

  // Then we get the right result and it was marked as successful.
  t.equal(task.getResult(), 42);
  t.equal(task.getStatus(), 'successful');
  t.equal(task.getError(), undefined);
});

test('[Task] it can fail', async (t: Test) => {
  // Given a "pending" task that throws an error.
  const task = new Task(() => {
    t.equal(task.getStatus(), 'running');
    throw new Error('Test Task Failure');
  });
  t.equal(task.getResult(), undefined);
  t.equal(task.getStatus(), 'pending');

  // When we run the task.
  try {
    await task.run();
    t.fail('Test task should have failed');
  } catch (error) {
    // Then the task is marked as failed and we kept track of the error.
    t.equal(task.getStatus(), 'failed');
    t.equal(task.getResult(), undefined);
    t.equal(task.getError(), error);
  }
});

test('[Task] it can be aborted using an AbortController', async (t: Test) => {
  // Given a test task that returns a number after 100ms.
  const task = new Task(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return 42;
  });

  // And an abort controller used to cancel the task.
  const abortController = new AbortController();

  // When we run the task and abort after 10ms.
  setTimeout(() => abortController.abort(), 10);
  try {
    await task.run({ signal: abortController.signal });
  } catch (error) {
    t.equal((error as Event).type, 'abort');
  }

  // Then the task was marked as canceled.
  t.equal(task.getStatus(), 'canceled');
  t.equal(task.getResult(), undefined);
  t.equal((task.getError() as Event).type, 'abort');
});

test('[Task] it can be reset', async (t: Test) => {
  // Given a test task that ran successfully.
  const task = new Task(() => 42);
  await task.run();
  t.equal(task.getStatus(), 'successful');
  t.equal(task.getResult(), 42);

  // When we reset the task.
  task.reset();

  // Then the task was marked as pending.
  t.equal(task.getStatus(), 'pending');
  t.equal(task.getResult(), undefined);
});

test('[Task] it can be loaded with a preloaded result', async (t: Test) => {
  // Given a test task that returns a number.
  const task = new Task(() => 42);

  // When we load the task with a preloaded number.
  task.loadWith(180);

  // Then the task is marked as successful and return the preloaded number.
  t.equal(task.getStatus(), 'successful');
  t.equal(task.getResult(), 180);
  t.equal(task.getError(), undefined);
});

test('[Task] it can listen to status changes', async (t: Test) => {
  // Given a helper methods that keeps track of a task's history.
  const useHistory = async <T>(task: Task<T>) => {
    const history: string[] = [];
    task.onStatusChange((status) => history.push(status));
    return history;
  };

  // Then we get the right history for successful tasks.
  const l1 = new Task(() => 42);
  const h1 = await useHistory(l1);
  await l1.run();
  t.deepEqual(h1, ['running', 'successful']);

  // And we get the right history for failed tasks.
  const l2 = new Task(() => {
    throw new Error();
  });
  const h2 = await useHistory(l2);
  try {
    await l2.run();
  } catch (error) {
    // Fail silently...
  }
  t.deepEqual(h2, ['running', 'failed']);

  // And we get the right history for canceled tasks.
  const abortController = new AbortController();
  setTimeout(() => abortController.abort(), 10);
  const l3 = new Task(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return 42;
  });
  const h3 = await useHistory(l3);
  try {
    await l3.run({ signal: abortController.signal });
  } catch (error) {
    // Fail silently...
  }
  t.deepEqual(h3, ['running', 'canceled']);

  // And we get the right history for preloaded and resetted tasks.
  const l4 = new Task(() => 42);
  const h4 = await useHistory(l4);
  l4.loadWith(180);
  l4.reset();
  t.deepEqual(h4, ['successful', 'pending']);
});

test('[Task] it can be given additional context', async (t: Test) => {
  // Given a test task that returns a number.
  const task = new Task(() => 42);

  // When we provide additional context to that task
  task.setContext({
    name: 'Computing the answer to the universe',
    accuracy: 100,
  });

  // Then we can fetch that context at any time later on.
  t.same(task.getContext<{ name: string; accuracy: number }>(), {
    name: 'Computing the answer to the universe',
    accuracy: 100,
  });
});
