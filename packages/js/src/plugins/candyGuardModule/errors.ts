import {
  MetaplexError,
  MetaplexErrorInputWithoutSource,
  MetaplexErrorOptions,
} from '@/errors';

/** @group Errors */
export class CandyGuardError extends MetaplexError {
  constructor(input: MetaplexErrorInputWithoutSource) {
    super({
      ...input,
      key: `plugin.candy_guard.${input.key}`,
      title: `Candy Guard > ${input.title}`,
      source: 'plugin',
      sourceDetails: 'Candy Guard',
    });
  }
}

/** @group Errors */
export class UnregisteredCandyGuardError extends CandyGuardError {
  constructor(name: string, options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'unregistered_candy_guard',
      title: 'Unregistered Candy Guard',
      problem:
        `The SDK is trying to access a custom Candy Guard named [${name}] ` +
        `but that guard was not registered in the SDK`,
      solution:
        'Register your custom guard by calling the `metaplex.candyGuards().register()` method.',
    });
  }
}
