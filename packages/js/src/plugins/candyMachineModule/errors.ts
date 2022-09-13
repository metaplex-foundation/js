import { BigNumber } from '@/types';
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
        'Register your custom guard by calling the `metaplex.candyMachines().guards().register()` method.',
    });
  }
}

/** @group Errors */
export class CandyMachineIsFullError extends CandyMachineV3Error {
  constructor(
    index: number,
    itemsAvailable: number,
    options?: MetaplexErrorOptions
  ) {
    super({
      options,
      key: 'candy_machine_is_full',
      title: 'Candy Machine Is Full',
      problem:
        `You are trying to add an item at index ${index} to a Candy Machine that ` +
        `can only hold a maximum of ${itemsAvailable} items.`,
      solution:
        'Limit number of items you are adding or create a Candy Machine that can hold more of them.',
    });
  }
}

/** @group Errors */
export class CandyMachineIsEmptyError extends CandyMachineV3Error {
  constructor(itemsAvailable: BigNumber, options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'candy_machine_is_empty',
      title: 'Candy Machine Is Empty',
      problem:
        `You're trying to mint from an empty candy machine. ` +
        `All ${itemsAvailable} items have been minted.`,
      solution: 'You can no longer mint from this Candy Machine.',
    });
  }
}

/** @group Errors */
export class CandyMachineCannotAddAmountError extends CandyMachineV3Error {
  constructor(
    index: number,
    amount: number,
    itemsAvailable: number,
    options?: MetaplexErrorOptions
  ) {
    super({
      options,
      key: 'candy_machine_cannot_add_amount',
      title: 'Candy Machine Cannot Add Amount',
      problem:
        `You are trying to add ${amount} items to candy machine starting at index ${index} ` +
        ` but it can only hold a maximum of ${itemsAvailable} items.`,
      solution:
        'Limit number of assets you are adding or create a Candy Machine that can hold more of them.',
    });
  }
}

/** @group Errors */
export class CandyMachineItemTextTooLongError extends CandyMachineV3Error {
  constructor(
    index: number,
    type: 'name' | 'uri',
    text: string,
    limit: number,
    options?: MetaplexErrorOptions
  ) {
    super({
      options,
      key: 'candy_machine_item_text_too_long',
      title: 'Candy Machine Item Text Too Long',
      problem:
        `You are trying to add an item to a Candy Machine but its ${type} is too long. ` +
        `The item settings define the ${type} limit as ${limit} characters but the following ` +
        `content was provided [${text}] for the item at index ${index}`,
      solution: `Reduce the size of the ${type} for the item at index ${index}.`,
    });
  }
}
