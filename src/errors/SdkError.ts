import { MetaplexError, MetaplexErrorInputWithoutSource } from './MetaplexError';

export class SdkError extends MetaplexError {
  constructor(input: MetaplexErrorInputWithoutSource) {
    super({
      ...input,
      key: `sdk.${input.key}`,
      source: 'sdk',
    });
  }

  static operationHandlerMissing(operationKey: string, cause?: Error) {
    return new this({
      cause,
      key: 'operation_handler_missing',
      title: 'Operation Handler Missing',
      problem: `No operation handler was registered for the [${operationKey}] operation.`,
      solution:
        'Ensure an operation handler is registered by using the following code: ' +
        '"metaplex.register(operation, operationHandler)".',
    });
  }

  static invalidJsonVariable(cause?: Error) {
    return new this({
      cause,
      key: 'invalid_json_variable',
      title: 'Invalid JSON Variable',
      problem: 'The provided JSON variable could not be parsed into a string.',
      solution:
        'Ensure the variable can be parsed as a JSON string using "JSON.stringify(myVariable)".',
    });
  }

  static invalidJsonString(cause?: Error) {
    return new this({
      cause,
      key: 'invalid_json_string',
      title: 'Invalid JSON String',
      problem: 'The provided string could not be parsed into a JSON variable.',
      solution: 'Ensure the provided string uses a valid JSON syntax.',
    });
  }

  static operationUnauthorizedForGuests(operation: string, cause?: Error) {
    return new this({
      cause,
      key: 'operation_unauthorized_for_guests',
      title: 'Operation Unauthorized For Guests',
      problem: `Trying to access the [${operation}] operation as a guest.`,
      solution:
        'Ensure your wallet is connected using the identity driver. ' +
        'For instance, by using "metaplex.use(walletAdapterIdentity(wallet))" or ' +
        '"metaplex.use(keypairIdentity(keypair))".',
    });
  }
}
