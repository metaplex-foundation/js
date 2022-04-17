import { AbortSignal } from 'abort-controller';
import { EventEmitter } from 'eventemitter3';
import { useDisposable, DisposableScope } from './useDisposable';

export type LoaderStatus = 'pending' | 'running' | 'successful' | 'failed' | 'canceled';

export type LoaderOptions = {
  failSilently?: boolean;
  signal?: AbortSignal;
};

export const useLoader = <T>(callback: (scope: DisposableScope) => T) => {
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
  const forceRun = async (options: LoaderOptions = {}): Promise<T | undefined> => {
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

        // Return undefined result if loaded aborted or if we want to fail silently.
        if (isCanceled() || (options.failSilently ?? false)) {
          return undefined;
        }

        // Otherwise, re-throw the error.
        throw error;
      }
    });
  };

  const reload = async (options: LoaderOptions = {}): Promise<T | undefined> => {
    if (isRunning()) {
      // TODO: Custom errors.
      throw new Error('Loader is already running.');
    }

    return forceRun(options);
  };

  const load = async (options: LoaderOptions = {}): Promise<T | undefined> => {
    if (!isPending()) {
      return getResult();
    }

    return reload(options);
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
