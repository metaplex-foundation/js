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
  let canceled = false;
  let cancelationError: unknown = null;
  let eventEmitter = new EventEmitter();
  const scope: AbortSignalScope = {
    isCanceled: () => canceled,
    getCancelationError: () => cancelationError,
    onCancel: (callback: (reason: unknown) => void) => {
      eventEmitter.on('cancel', callback);
    },
    throwIfCanceled: () => {
      if (canceled) {
        throw cancelationError;
      }
    },
  };

  const abortListener = (error: unknown) => {
    canceled = true;
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
