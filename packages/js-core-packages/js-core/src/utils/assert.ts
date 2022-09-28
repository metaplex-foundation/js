/**
 * Error indicating that an assertion failed.
 * @group Errors
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
 * Assserts that the provided condition is true.
 * @internal
 */
export default function assert(
  condition: boolean,
  message?: string
): asserts condition {
  if (!condition) {
    throw new AssertionError(message ?? 'Assertion failed');
  }
}

/**
 * Asserts that both values are strictly equal.
 * @internal
 */
assert.equal = function assertEqual<T>(
  actual: unknown,
  expected: T,
  message?: string
): asserts actual is T {
  if (actual !== expected) {
    throw new AssertionError((message ?? '') + ` ${actual} !== ${expected}`);
  }
};
