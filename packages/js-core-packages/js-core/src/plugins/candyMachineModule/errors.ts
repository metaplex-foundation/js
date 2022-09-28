import {
  MetaplexError,
  MetaplexErrorInputWithoutSource,
  MetaplexErrorOptions,
} from '@/errors';
import { CandyMachineItem, CandyMachineEndSettings } from './models';
import { BigNumber, DateTime, formatDateTime } from '@/types';
import { Option } from '@/utils';
import { EndSettingType } from '@metaplex-foundation/mpl-candy-machine';

/** @group Errors */
export class CandyMachineError extends MetaplexError {
  constructor(input: MetaplexErrorInputWithoutSource) {
    super({
      ...input,
      key: `plugin.candy_machine.${input.key}`,
      title: `Candy Machine > ${input.title}`,
      source: 'plugin',
      sourceDetails: 'Candy Machine',
    });
  }
}

/** @group Errors */
export class CandyMachineIsFullError extends CandyMachineError {
  constructor(
    assetIndex: BigNumber,
    itemsAvailable: BigNumber,
    options?: MetaplexErrorOptions
  ) {
    super({
      options,
      key: 'candy_machine_is_full',
      title: 'Candy Machine Is Full',
      problem:
        `Trying to add asset number ${assetIndex.addn(1)}, but ` +
        `candy machine only can hold ${itemsAvailable} assets.`,
      solution:
        'Limit number of assets you are adding or create a new Candy Machine that can hold more.',
    });
  }
}

/** @group Errors */
export class CandyMachineIsEmptyError extends CandyMachineError {
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
export class CandyMachineCannotAddAmountError extends CandyMachineError {
  constructor(
    index: BigNumber,
    amount: number,
    itemsAvailable: BigNumber,
    options?: MetaplexErrorOptions
  ) {
    super({
      options,
      key: 'candy_machine_cannot_add_amount',
      title: 'Candy Machine Cannot Add Amount',
      problem: `Trying to add ${amount} assets to candy machine that already has ${index} assets and can only hold ${itemsAvailable} assets.`,
      solution:
        'Limit number of assets you are adding or create a new Candy Machine that can hold more.',
    });
  }
}

/** @group Errors */
export class CandyMachineAddItemConstraintsViolatedError extends CandyMachineError {
  constructor(
    index: BigNumber,
    item: CandyMachineItem,
    options?: MetaplexErrorOptions
  ) {
    super({
      options,
      key: 'candy_machine_add_item_constraints_violated',
      title: 'Candy Machine Add Item Constraints Violated',
      problem: `Trying to add an asset with name "${item.name}" and uri: "${item.uri}" to candy machine at index ${index} that violates constraints.`,
      solution: 'Fix the name or URI of this asset and try again.',
    });
  }
}

/** @group Errors */
export class CandyMachineNotLiveError extends CandyMachineError {
  constructor(goLiveDate: Option<DateTime>, options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'candy_machine_not_live',
      title: 'Candy Machine Not Live',
      problem:
        `You're trying to mint from a Candy Machine which is not live yet. ` +
        (goLiveDate
          ? `It will go live on ${formatDateTime(goLiveDate)}.`
          : `Its live date has not been set yet.`),
      solution:
        'You need to wait until the Candy Machine is live to mint from it. ' +
        'If this is your Candy Machine, use "metaplex.candyMachines().update(...)" to set the live date. ' +
        'Note that the authority of the Candy Machine can mint regardless of the live date.',
    });
  }
}

/** @group Errors */
export class CandyMachineEndedError extends CandyMachineError {
  constructor(
    endSetting: CandyMachineEndSettings,
    options?: MetaplexErrorOptions
  ) {
    const endSettingType =
      endSetting.endSettingType === EndSettingType.Amount ? 'Amount' : 'Date';
    const endSettingExplanation =
      endSetting.endSettingType === EndSettingType.Amount
        ? `All ${endSetting.number} items have been minted.`
        : `It ended on ${formatDateTime(endSetting.date)}.`;
    super({
      options,
      key: 'candy_machine_ended',
      title: 'Candy Machine Ended',
      problem:
        `The end condition [${endSettingType}] of this Candy Machine has been reached. ` +
        endSettingExplanation,
      solution: 'You can no longer mint from this Candy Machine.',
    });
  }
}

/** @group Errors */
export class CandyMachineBotTaxError extends CandyMachineError {
  constructor(
    explorerLink: string,
    cause: Error,
    options?: Omit<MetaplexErrorOptions, 'cause'>
  ) {
    super({
      options: { ...options, cause },
      key: 'candy_machine_bot_tax',
      title: 'Candy Machine Bot Tax',
      problem:
        `The NFT couldn't be fetched after being minted. ` +
        `This is most likely due to a bot tax that occured during minting. ` +
        `When someone tries to mint an NFT from a Candy Machine which cannot be minted from, ` +
        `the program will succeed and charge a small tax to fight against bots.`,
      solution:
        `Ensure you can mint from the Candy Machine. ` +
        `You may want to check the transaction logs for more details: [${explorerLink}].`,
    });
  }
}
