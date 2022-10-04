import test, { Test } from 'tape';
import { Disposable } from '@/index';

test('[Disposable] it can cancel callbacks', async (t: Test) => {
  // Given a disposable.
  const abortController = new AbortController();
  const disposable = new Disposable(abortController.signal);

  // And a variable that keeps track of some callback execution.
  let endOfCallbackExecuted = false;

  // When we run a callback that throws early if it is cancelled.
  const promise = disposable.run(async ({ throwIfCanceled }) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    throwIfCanceled();
    endOfCallbackExecuted = true;
  });

  // And we abort the disposable.
  abortController.abort();

  // Then the disposable callback threw an error.
  try {
    await promise;
    t.fail('disposable callback should have thrown an error');
  } catch (error) {
    // And the last part of the callback was not executed.
    t.false(endOfCallbackExecuted, 'end of callback not executed');

    // And the disposable kepts track of the cancellation error.
    t.ok(disposable.isCanceled(), 'disposable is cancelled');
    t.equal(error, disposable.getCancelationError());
  }
});

test('[Disposable] it provides a useful scope to the callback', async (t: Test) => {
  // Given a disposable.
  const abortController = new AbortController();
  const disposable = new Disposable(abortController.signal);

  // When we use it to run a callback.
  await disposable.run(async (scope) => {
    // Then we get a useful scope.
    t.equals(typeof scope.throwIfCanceled, 'function');
    t.equal(scope.signal, abortController.signal);
    t.false(scope.isCanceled(), 'isCanceled returns false');
    t.equals(scope.getCancelationError(), null);

    // And that scope returns different values based on the disposable state.
    abortController.abort();
    t.true(scope.isCanceled(), 'isCanceled returns true');
  });
});

test('[Disposable] it can listen to the disposable cancellation', async (t: Test) => {
  // Given a disposable.
  const abortController = new AbortController();
  const disposable = new Disposable(abortController.signal);

  // With an abort listener registered.
  let abortListenerExecuted = false;
  disposable.onCancel(() => {
    abortListenerExecuted = true;
  });

  // When we abort the disposable.
  abortController.abort();

  // Then the abort listener was executed.
  t.true(abortListenerExecuted, 'abort listener was executed');
});

test('[Disposable] it can close the abort listener', async (t: Test) => {
  // Given a disposable.
  const abortController = new AbortController();
  const disposable = new Disposable(abortController.signal);

  // With an abort listener registered.
  let abortListenerExecuted = false;
  disposable.onCancel(() => {
    abortListenerExecuted = true;
  });

  // When we close the disposable before aborting it.
  disposable.close();
  abortController.abort();

  // Then the abort listener was not executed.
  t.false(abortListenerExecuted, 'abort listener was not executed');
});

test('[Disposable] it closes the abort listener after running a callback by default', async (t: Test) => {
  // Given a disposable.
  const abortController = new AbortController();
  const disposable = new Disposable(abortController.signal);

  // With an abort listener registered.
  let abortListenerExecuted = false;
  disposable.onCancel(() => {
    abortListenerExecuted = true;
  });

  // When we finish executing any callback.
  await disposable.run(() => {});

  // And then abort the disposable.
  abortController.abort();

  // Then, by default, the abort listener was not executed.
  t.false(abortListenerExecuted, 'abort listener was not executed');
});
