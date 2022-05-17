import { AbortSignal } from 'abort-controller';
import EventEmitterPackage from 'eventemitter3';
import { TaskIsAlreadyRunningError } from '@/errors';
import { useDisposable, DisposableScope } from './useDisposable';

export type TaskStatus =
  | 'pending'
  | 'running'
  | 'successful'
  | 'failed'
  | 'canceled';
export type TaskCallback<T> = (scope: DisposableScope) => T | Promise<T>;

export type TaskOptions = {
  signal?: AbortSignal;
  force?: boolean;
};

export type Task<T> = {
  getStatus: () => TaskStatus;
  getResult: () => T | undefined;
  getError: () => unknown;
  isPending: () => boolean;
  isRunning: () => boolean;
  isCompleted: () => boolean;
  isSuccessful: () => boolean;
  isFailed: () => boolean;
  isCanceled: () => boolean;
  run: (options?: TaskOptions) => Promise<T>;
  loadWith: (preloadedResult: T) => Task<T>;
  reset: () => Task<T>;
  onStatusChange: (callback: (status: TaskStatus) => unknown) => Task<T>;
  onStatusChangeTo: (status: TaskStatus, callback: () => unknown) => Task<T>;
  onSuccess: (callback: () => unknown) => Task<T>;
  onFailure: (callback: () => unknown) => Task<T>;
  onCancel: (callback: () => unknown) => Task<T>;
};

export const useTask = <T>(callback: TaskCallback<T>) => {
  // State.
  let status: TaskStatus = 'pending';
  let result: T | undefined = undefined;
  let error: unknown = undefined;
  const eventEmitter = new EventEmitterPackage.EventEmitter();

  // Getters.
  const getStatus = () => status;
  const getResult = () => result;
  const getError = () => error;
  const isPending = () => status === 'pending';
  const isRunning = () => status === 'running';
  const isCompleted = () => status !== 'pending' && status !== 'running';
  const isSuccessful = () => status === 'successful';
  const isFailed = () => status === 'failed';
  const isCanceled = () => status === 'canceled';

  // Setters.
  const setStatus = (newStatus: TaskStatus) => {
    if (status === newStatus) return;
    status = newStatus;
    eventEmitter.emit('statusChange', newStatus);
  };

  // Run methods.
  const forceRun = async (options: TaskOptions = {}): Promise<T> => {
    const disposable = useDisposable(options.signal).onCancel((cancelError) => {
      setStatus('canceled');
      error = cancelError;
    });

    return disposable.run(async (scope) => {
      const { isCanceled, throwIfCanceled } = scope;

      try {
        // Start loading.
        setStatus('running');
        result = undefined;
        error = undefined;
        result = await Promise.resolve(callback(scope));
        throwIfCanceled();
        setStatus('successful');

        // Return the loaded result.
        return result;
      } catch (newError) {
        // Capture the error and reset the result.
        error = newError;
        result = undefined;
        setStatus(isCanceled() ? 'canceled' : 'failed');

        // Re-throw the error.
        throw error;
      }
    });
  };

  const run = async (options: TaskOptions = {}): Promise<T> => {
    if (isRunning()) {
      throw new TaskIsAlreadyRunningError();
    }

    if (isPending() || (options.force ?? false)) {
      return forceRun(options);
    }

    if (isSuccessful()) {
      return getResult() as T;
    }

    throw getError();
  };

  return {
    getStatus,
    getResult,
    getError,
    isPending,
    isRunning,
    isCompleted,
    isSuccessful,
    isFailed,
    isCanceled,
    run,
    loadWith(preloadedResult: T) {
      setStatus('successful');
      result = preloadedResult;
      error = undefined;

      return this;
    },
    reset() {
      setStatus('pending');
      result = undefined;
      error = undefined;

      return this;
    },
    onStatusChange(callback: (status: TaskStatus) => unknown) {
      eventEmitter.on('statusChange', callback);

      return this;
    },
    onStatusChangeTo(status: TaskStatus, callback: () => unknown) {
      return this.onStatusChange((newStatus) =>
        status === newStatus ? callback() : undefined
      );
    },
    onSuccess(callback: () => unknown) {
      return this.onStatusChangeTo('successful', callback);
    },
    onFailure(callback: () => unknown) {
      return this.onStatusChangeTo('failed', callback);
    },
    onCancel(callback: () => unknown) {
      return this.onStatusChangeTo('canceled', callback);
    },
  };
};
