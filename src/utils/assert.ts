/**
 * Error indicating that an assertion failed.
 */
export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Asserts that both values are strictly equal.
 */
export function equal<T>(actual: unknown, expected: T, message?: string): asserts actual is T {
  if (actual !== expected) {
    throw new AssertionError((message ?? '') + ` ${actual} !== ${expected}`);
  }
}

/**
 * Assserts that the provided condition is true.
 *
 */
export default function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new AssertionError(message ?? 'Assertion failed');
  }
}
