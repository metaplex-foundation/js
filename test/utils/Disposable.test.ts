import test, { Test } from 'tape';
import { AbortController } from 'abort-controller';
import { Disposable } from '@/index';

test.only('[Disposable] it can cancel callbacks', async (t: Test) => {
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
  // Given
  // When
  // Then
});

test('[Disposable] it can close the abort listener', async (t: Test) => {
  // Given
  // When
  // Then
});

test('[Disposable] it closes the abort listener after running a callback by default', async (t: Test) => {
  // Given
  // When
  // Then
});

test('[Disposable] it can be used through multiple callbacks', async (t: Test) => {
  // Given
  // When
  // Then
});
