import { AbortSignal } from 'abort-controller';
import { Metaplex } from '../Metaplex.js';

export type LoaderStatus = 'pending' | 'running' | 'successful' | 'failed' | 'canceled';

export interface LoaderOptions {
  failSilently?: boolean;
}

export abstract class Loader<T> {
  protected status: LoaderStatus = 'pending';
  protected result?: T;
  protected error?: unknown;
  protected abortSignal?: AbortSignal;

  public abstract handle(metaplex: Metaplex): Promise<T>;

  setAbortSignal(abortSignal: AbortSignal) {
    this.abortSignal = abortSignal;

    return this;
  }

  public async reload(metaplex: Metaplex, options: LoaderOptions = {}): Promise<T | undefined> {
    if (this.isLoading()) {
      // TODO: Custom errors.
      throw new Error('Loader is already running.');
    }

    // Prepare abort listener.
    const abortListener = (reason: unknown) => {
      this.status = 'canceled';
      this.error = reason;
    };
    this.abortSignal?.addEventListener('abort', abortListener, { once: true });

    try {
      // Start loading.
      this.status = 'running';
      this.error = undefined;
      this.result = await this.handle(metaplex);

      // Mark as successful if the loader wasn't aborted.
      if (!this.wasCanceled()) {
        this.status = 'successful';
      }

      // Return the loaded result.
      return this.result;
    } catch (error) {
      // Capture the error and reset the result.
      this.error = error;
      this.result = undefined;

      // Mark as failed if the loader wasn't aborted.
      if (!this.wasCanceled()) {
        this.status = 'failed';
      }

      // Return undefined result if loaded aborted or if we want to fail silently.
      if (this.wasCanceled() || (options.failSilently ?? false)) {
        return this.result;
      }

      // Otherwise, re-throw the error.
      throw error;
    } finally {
      // Clean up the abort listener.
      this.abortSignal?.removeEventListener('abort', abortListener);
    }
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
