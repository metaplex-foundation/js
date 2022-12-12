import { MetaplexError } from './MetaplexError';

/** @group Errors */
export class SdkError extends MetaplexError {
  readonly name: string = 'SdkError';
  constructor(message: string, cause?: Error) {
    super(message, 'sdk', undefined, cause);
  }
}

/** @group Errors */
export class AssetNotFoundError extends SdkError {
  readonly name: string = 'AssetNotFoundError';
  constructor(location: string, cause?: Error) {
    const message =
      `The asset at [${location}] could not be found. ` +
      'Ensure the asset exists at the given path or URI.';
    super(message, cause);
  }
}

/** @group Errors */
export class InvalidJsonVariableError extends SdkError {
  readonly name: string = 'InvalidJsonVariableError';
  constructor(cause?: Error) {
    const message =
      'The provided JSON variable could not be parsed into a string. ' +
      'Ensure the variable can be parsed as a JSON string using "JSON.stringify(myVariable)".';
    super(message, cause);
  }
}

/** @group Errors */
export class InvalidJsonStringError extends SdkError {
  readonly name: string = 'InvalidJsonStringError';
  constructor(cause?: Error) {
    const message =
      'The provided string could not be parsed into a JSON variable. ' +
      'Ensure the provided string uses a valid JSON syntax.';
    super(message, cause);
  }
}
