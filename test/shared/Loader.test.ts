import test, { Test } from 'tape';
import { Loader } from '@/index';
import { metaplexGuest } from 'test/helpers';

class TestLoader<T> extends Loader<T> {
  protected cb: () => Promise<T>;

  constructor(cb: () => Promise<T>) {
    super();
    this.cb = cb;
  }

  public async handle(): Promise<T> {
    const result = await this.cb();
    if (this.wasCanceled()) throw this.error;

    return result;
  }
}

test('it can succeed', async (t: Test) => {
  // Given a metaplex instance.
  const mx = metaplexGuest();

  // And a "pending" test loader that returns a number.
  const loader = new TestLoader(async () => {
    t.equal(loader.getStatus(), 'running');
    return 42;
  });
  t.equal(loader.getResult(), undefined);
  t.equal(loader.getStatus(), 'pending');

  // When we load the loader.
  await loader.load(mx);

  // Then we get the right result and it was marked as successful.
  t.equal(loader.getResult(), 42);
  t.equal(loader.getStatus(), 'successful');
  t.equal(loader.getError(), undefined);
});

test('it can fail', async (t: Test) => {
  // Given a metaplex instance.
  const mx = metaplexGuest();

  // And a "pending" test loader that throws an error.
  const loader = new TestLoader(async () => {
    t.equal(loader.getStatus(), 'running');
    throw new Error('Test Loader Failure');
  });
  t.equal(loader.getResult(), undefined);
  t.equal(loader.getStatus(), 'pending');

  // When we load the loader.
  try {
    await loader.load(mx);
  }
  
  // Then the loader is marked as failed and we kept track of the error.
  catch (error) {
    t.equal(loader.getStatus(), 'failed');
    t.equal(loader.getResult(), undefined);
    t.equal(loader.getError(), error);
    return;
  }

  t.fail('Test loader should have failed');
});

test('it can fail silently', async (t: Test) => {
  // Given a metaplex instance.
  const mx = metaplexGuest();

  // And a test loader that throws an error.
  const loader = new TestLoader(async () => {
    throw new Error('Test Loader Failure');
  });

  // When we load the loader using the "failSilently" option
  // outside of a try/catch.
  await loader.load(mx, { failSilently: true });
  
  // Then execution continues but the loader was marked as failed
  // and we kept track of the error.
  t.equal(loader.getStatus(), 'failed');
  t.equal(loader.getResult(), undefined);
  t.true(loader.getError() instanceof Error);
  t.equal((loader.getError() as Error).message, 'Test Loader Failure');
});

test('it can be aborted using an AbortController', async (t: Test) => {
  // Given a metaplex instance.
  const mx = metaplexGuest();

  // And a test loader that returns a number after 100ms.
  const loader = new TestLoader(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return 42;
  });

  // And an abort controller used to cancel the loader.
  const abortController = new AbortController();
  loader.setAbortSignal(abortController.signal);

  // When we load the loader and abort after 10ms.
  setTimeout(() => abortController.abort(), 10);
  await loader.load(mx);

  // Then the loader was marked as canceled.
  t.equal(loader.getStatus(), 'canceled');
  t.equal(loader.getResult(), undefined);
  t.true(loader.getError() instanceof Event);
  t.equal((loader.getError() as Event).type, 'abort');
});

test('it can be reset', async (t: Test) => {
  // Given a metaplex instance.
  const mx = metaplexGuest();

  // And a test loader that loaded successfully.
  const loader = new TestLoader(async () => 42);
  await loader.load(mx);
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
  const loader = new TestLoader(async () => 42);

  // When we load the loader with a preloaded number.
  loader.loadWith(180);

  // Then the loader is marked as successful and return the preloaded number.
  t.equal(loader.getStatus(), 'successful');
  t.equal(loader.getResult(), 180);
  t.equal(loader.getError(), undefined);
});
