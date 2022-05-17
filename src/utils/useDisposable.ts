import { AbortSignal } from 'abort-controller';
import EventEmitterPackage from 'eventemitter3';

export type DisposableScope = {
  signal: AbortSignal | undefined;
  isCanceled: () => boolean;
  getCancelationError: () => unknown;
  throwIfCanceled: () => void;
};

export const useDisposable = (signal: AbortSignal | undefined) => {
  // Abort getters.
  let cancelationError: unknown = null;
  const isCanceled = () => signal?.aborted ?? false;
  const getCancelationError = () => cancelationError;

  // Abort listeners.
  const eventEmitter = new EventEmitterPackage.EventEmitter();
  const close = () => {
    signal?.removeEventListener('abort', abortListener);
    eventEmitter.removeAllListeners();
  };
  const abortListener = (error: unknown) => {
    cancelationError = error;
    eventEmitter.emit('cancel', error);
    close();
  };
  signal?.addEventListener('abort', abortListener);

  // Abort scope to give to the callback.
  const scope: DisposableScope = {
    signal,
    isCanceled,
    getCancelationError,
    throwIfCanceled: () => {
      if (isCanceled()) {
        throw getCancelationError();
      }
    },
  };
  const run = async <T = unknown>(
    callback: (scope: DisposableScope) => T
  ): Promise<T> => {
    try {
      return await Promise.resolve(callback(scope));
    } finally {
      close();
    }
  };

  return {
    run,
    isCanceled,
    getCancelationError,
    onCancel(callback: (reason: unknown) => unknown) {
      eventEmitter.on('cancel', callback);
      return this;
    },
  };
};
