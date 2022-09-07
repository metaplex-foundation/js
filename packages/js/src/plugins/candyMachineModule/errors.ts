import {
  MetaplexError,
  MetaplexErrorInputWithoutSource,
  MetaplexErrorOptions,
} from '@/errors';

/** @group Errors */
export class CandyMachineV3Error extends MetaplexError {
  constructor(input: MetaplexErrorInputWithoutSource) {
    super({
      ...input,
      key: `plugin.candy_machine_v3.${input.key}`,
      title: `Candy Machine V3 > ${input.title}`,
      source: 'plugin',
      sourceDetails: 'Candy Machine V3',
    });
  }
}

/** @group Errors */
export class UnregisteredCandyGuardError extends CandyMachineV3Error {
  constructor(name: string, options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'unregistered_candy_guard',
      title: 'Unregistered Candy Guard',
      problem:
        `The SDK is trying to access a custom Candy Guard named [${name}] ` +
        `but that guard was not registered in the SDK`,
      solution:
        'Register your custom guard by calling the `metaplex.candyGuards().guards().register()` method.',
    });
  }
}
