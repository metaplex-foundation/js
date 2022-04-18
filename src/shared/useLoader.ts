import { AbortSignal } from 'abort-controller';
import { EventEmitter } from 'eventemitter3';
import { useDisposable, DisposableScope } from './useDisposable';

export type LoaderStatus = 'pending' | 'running' | 'successful' | 'failed' | 'canceled';
export type LoaderCallback<T> = (scope: DisposableScope) => T | Promise<T>;

export type LoaderOptions = {
  signal?: AbortSignal;
};

export type Loader<T> = {
  getStatus: () => LoaderStatus;
  getResult: () => T | undefined;
  getError: () => unknown;
  isPending: () => boolean;
  isRunning: () => boolean;
  isLoaded: () => boolean;
  isSuccessful: () => boolean;
  isFailed: () => boolean;
  isCanceled: () => boolean;
  reload: (options?: LoaderOptions) => Promise<T>;
  load: (options?: LoaderOptions) => Promise<T>;
  loadWith: (preloadedResult: T) => Loader<T>;
  reset: () => Loader<T>;
  onStatusChange: (callback: (status: LoaderStatus) => unknown) => Loader<T>;
  onStatusChangeTo: (status: LoaderStatus, callback: () => unknown) => Loader<T>;
  onSuccess: (callback: () => unknown) => Loader<T>;
  onFailure: (callback: () => unknown) => Loader<T>;
  onCancel: (callback: () => unknown) => Loader<T>;
};

export const useLoader = <T>(callback: LoaderCallback<T>) => {
  // State.
  let status: LoaderStatus = 'pending';
  let result: T | undefined = undefined;
  let error: unknown = undefined;
  const eventEmitter = new EventEmitter();

  // Getters.
  const getStatus = () => status;
  const getResult = () => result;
  const getError = () => error;
  const isPending = () => status === 'pending';
  const isRunning = () => status === 'running';
  const isLoaded = () => status !== 'pending' && status !== 'running';
  const isSuccessful = () => status === 'successful';
  const isFailed = () => status === 'failed';
  const isCanceled = () => status === 'canceled';

  // Setters.
  const setStatus = (newStatus: LoaderStatus) => {
    if (status === newStatus) return;
    status = newStatus;
    eventEmitter.emit('statusChange', newStatus);
  };

  // Run methods.
  const forceRun = async (options: LoaderOptions = {}): Promise<T> => {
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

  const reload = async (options: LoaderOptions = {}): Promise<T> => {
    if (isRunning()) {
      // TODO: Custom errors.
      throw new Error('Loader is already running.');
    }

    return forceRun(options);
  };

  const load = async (options: LoaderOptions = {}): Promise<T> => {
    if (!isLoaded()) {
      return reload(options);
    }

    if (!isSuccessful()) {
      throw getError();
    }

    return getResult() as T;
  };

  return {
    getStatus,
    getResult,
    getError,
    isPending,
    isRunning,
    isLoaded,
    isSuccessful,
    isFailed,
    isCanceled,
    reload,
    load,
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
    onStatusChange(callback: (status: LoaderStatus) => unknown) {
      eventEmitter.on('statusChange', callback);

      return this;
    },
    onStatusChangeTo(status: LoaderStatus, callback: () => unknown) {
      return this.onStatusChange((newStatus) => (status === newStatus ? callback() : undefined));
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
