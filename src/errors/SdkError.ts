import { MetaplexError, MetaplexErrorInputWithoutSource } from './MetaplexError';

export class SdkError extends MetaplexError {
  constructor(input: MetaplexErrorInputWithoutSource) {
    super({
      ...input,
      key: `sdk.${input.key}`,
      source: 'sdk',
    });
  }

  static operationHandlerMissing(operationKey: string) {
    return new this({
      key: 'operation_handler_missing',
      title: 'Operation Handler Missing',
      problem: `No operation handler was registered for the [${operationKey}] operation.`,
      solution:
        'Ensure an operation handler is registered by using the following code: ' +
        '"metaplex.register(operation, operationHandler)".',
    });
  }
}
