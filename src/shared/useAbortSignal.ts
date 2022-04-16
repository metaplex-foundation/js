import { AbortSignal } from 'abort-controller';
import { EventEmitter } from "eventemitter3";

export type AbortSignalScope = {
  isCanceled: () => boolean;
  getCancelationError: () => unknown;
  onCancel: (cb: (reason: unknown) => void) => void;
  throwIfCanceled: () => void;
}

export const useAbortSignal = async <T = unknown>(
  signal: AbortSignal | undefined,
  callback: (scope: AbortSignalScope) => Promise<T>
): Promise<T> => {
  let cancelationError: unknown = null;
  const isCanceled = () => signal?.aborted ?? false;
  const getCancelationError = () => cancelationError;
  const eventEmitter = new EventEmitter();
  const scope: AbortSignalScope = {
    isCanceled,
    getCancelationError,
    onCancel: (callback: (reason: unknown) => void) => {
      eventEmitter.on('cancel', callback);
    },
    throwIfCanceled: () => {
      if (isCanceled()) {
        throw getCancelationError();
      }
    },
  };

  const abortListener = (error: unknown) => {
    cancelationError = error;
    eventEmitter.emit('cancel', error);
  };

  signal?.addEventListener('abort', abortListener, { once: true });
  try {
    return await callback(scope);
  } finally {
    signal?.removeEventListener('abort', abortListener);
    eventEmitter.removeAllListeners();
  }
};
