import { AbortSignal } from 'abort-controller';
import { disposable } from '@/utils';
import { Metaplex } from '../Metaplex';

export type LoaderStatus = 'pending' | 'running' | 'successful' | 'failed' | 'canceled';

export interface LoaderOptions {
  failSilently?: boolean;
  signal?: AbortSignal;
}

export abstract class Loader<T> {
  protected status: LoaderStatus = 'pending';
  protected result?: T;
  protected error?: unknown;

  public abstract handle(metaplex: Metaplex): Promise<T>;

  public async reload(metaplex: Metaplex, options: LoaderOptions = {}): Promise<T | undefined> {
    if (this.isLoading()) {
      // TODO: Custom errors.
      throw new Error('Loader is already running.');
    }

    return disposable(async ({ isCanceled }) => {
        try {
          // Start loading.
          this.reset();
          this.status = 'running';
          this.result = await this.handle(metaplex);
          this.status = isCanceled() ? 'canceled' : 'successful';
    
          // Return the loaded result.
          return this.result;
        } catch (error) {
          // Capture the error and reset the result.
          this.error = error;
          this.result = undefined;
          this.status = isCanceled() ? 'canceled' : 'failed';
    
          // Return undefined result if loaded aborted or if we want to fail silently.
          if (isCanceled() || (options.failSilently ?? false)) {
            return undefined;
          }
    
          // Otherwise, re-throw the error.
          throw error;
        }
    }, options.signal)
  }

  public async load(metaplex: Metaplex, options: LoaderOptions = {}): Promise<T | undefined> {
    if (!this.isPending()) {
      return this.result;
    }

    return this.reload(metaplex, options);
  }

  public reset() {
    this.status = 'pending';
    this.result = undefined;
    this.error = undefined;

    return this;
  }

  public loadWith(preloadedResult: T) {
    this.status = 'successful';
    this.result = preloadedResult;
    this.error = undefined;

    return this;
  }

  public getStatus(): LoaderStatus {
    return this.status;
  }

  public getResult(): T | undefined {
    return this.result;
  }

  public getError(): unknown {
    return this.error;
  }

  public isPending(): boolean {
    return this.status === 'pending';
  }

  public isLoading(): boolean {
    return this.status === 'running';
  }

  public isLoaded(): boolean {
    return this.status !== 'pending' && this.status !== 'running';
  }

  public wasSuccessful(): boolean {
    return this.status === 'successful';
  }

  public wasFailed(): boolean {
    return this.status === 'failed';
  }

  public wasCanceled(): boolean {
    return this.status === 'canceled';
  }
}
