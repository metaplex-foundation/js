import test, { Test } from 'tape';
import AbortController from 'abort-controller';
import { useLoader, Loader } from '@/index';

test('it can succeed with an asynchronous callback', async (t: Test) => {
  // Given a "pending" async loader that returns a number.
  const loader = useLoader(async () => {
    t.equal(loader.getStatus(), 'running');
    return 42;
  });
  t.equal(loader.getResult(), undefined);
  t.equal(loader.getStatus(), 'pending');

  // When we load the loader.
  await loader.load();

  // Then we get the right result and it was marked as successful.
  t.equal(loader.getResult(), 42);
  t.equal(loader.getStatus(), 'successful');
  t.equal(loader.getError(), undefined);
});

test('it can succeed with an synchronous callback', async (t: Test) => {
  // Given a "pending" loader that returns a number.
  const loader = useLoader(() => {
    t.equal(loader.getStatus(), 'running');
    return 42;
  });
  t.equal(loader.getResult(), undefined);
  t.equal(loader.getStatus(), 'pending');

  // When we load the loader.
  await loader.load();

  // Then we get the right result and it was marked as successful.
  t.equal(loader.getResult(), 42);
  t.equal(loader.getStatus(), 'successful');
  t.equal(loader.getError(), undefined);
});

test('it can fail', async (t: Test) => {
  // Given a "pending" loader that throws an error.
  const loader = useLoader(() => {
    t.equal(loader.getStatus(), 'running');
    throw new Error('Test Loader Failure');
  });
  t.equal(loader.getResult(), undefined);
  t.equal(loader.getStatus(), 'pending');

  // When we load the loader.
  try {
    await loader.load();
  } catch (error) {
    // Then the loader is marked as failed and we kept track of the error.
    t.equal(loader.getStatus(), 'failed');
    t.equal(loader.getResult(), undefined);
    t.equal(loader.getError(), error);
    return;
  }

  t.fail('Test loader should have failed');
});

test('it can be aborted using an AbortController', async (t: Test) => {
  // Given a test loader that returns a number after 100ms.
  const loader = useLoader(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return 42;
  });

  // And an abort controller used to cancel the loader.
  const abortController = new AbortController();

  // When we load the loader and abort after 10ms.
  setTimeout(() => abortController.abort(), 10);
  try {
    await loader.load({ signal: abortController.signal });
  } catch (error) {
    //
  }

  // Then the loader was marked as canceled.
  t.equal(loader.getStatus(), 'canceled');
  t.equal(loader.getResult(), undefined);
  t.equal((loader.getError() as Event).type, 'abort');
});

test('it can be reset', async (t: Test) => {
  // Given a test loader that loaded successfully.
  const loader = useLoader(() => 42);
  await loader.load();
  t.equal(loader.getStatus(), 'successful');
  t.equal(loader.getResult(), 42);

  // When we reset the loader.
  loader.reset();

  // Then the loader was marked as pending.
  t.equal(loader.getStatus(), 'pending');
  t.equal(loader.getResult(), undefined);
});

test('it can be loaded with a preloaded result', async (t: Test) => {
  // Given a test loader that returns a number.
  const loader = useLoader(() => 42);

  // When we load the loader with a preloaded number.
  loader.loadWith(180);

  // Then the loader is marked as successful and return the preloaded number.
  t.equal(loader.getStatus(), 'successful');
  t.equal(loader.getResult(), 180);
  t.equal(loader.getError(), undefined);
});

test('it can listen to status changes', async (t: Test) => {
  // Given a helper methods that keeps track of a loader's history.
  const useHistory = async <T>(loader: Loader<T>) => {
    const history: string[] = [];
    await loader.onStatusChange((status) => history.push(status));
    return history;
  };

  // Then we get the right history for successful loaders.
  const l1 = useLoader(() => 42);
  const h1 = await useHistory(l1);
  await l1.load();
  t.deepEqual(h1, ['running', 'successful']);

  // And we get the right history for failed loaders.
  const l2 = useLoader(() => {
    throw new Error();
  });
  const h2 = await useHistory(l2);
  try {
    await l2.load();
  } catch (error) {
    // Fail silently...
  }
  t.deepEqual(h2, ['running', 'failed']);

  // And we get the right history for canceled loaders.
  const abortController = new AbortController();
  setTimeout(() => abortController.abort(), 10);
  const l3 = useLoader(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return 42;
  });
  const h3 = await useHistory(l3);
  try {
    await l3.load({ signal: abortController.signal });
  } catch (error) {
    // Fail silently...
  }
  t.deepEqual(h3, ['running', 'canceled']);

  // And we get the right history for preloaded and resetted loaders.
  const l4 = useLoader(() => 42);
  const h4 = await useHistory(l4);
  l4.loadWith(180);
  l4.reset();
  t.deepEqual(h4, ['successful', 'pending']);
});
