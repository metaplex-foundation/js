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

/** @group Errors */
export class CandyMachineBotTaxError extends CandyMachineV3Error {
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

/** @group Errors */
export class MintingRequiresGroupLabelError extends CandyMachineV3Error {
  constructor(availableGroups: string[], options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'minting_requires_group_label',
      title: 'Minting Requires Group Label',
      problem:
        "You're trying to mint an NFT from a Candy Machine that has groups of guards " +
        'but no group label was provided to identity which group we should mint from.',
      solution:
        'Please provide the label of the group you wish to mint from via the `group` parameter. ' +
        `The available groups are [${availableGroups.join(', ')}]`,
    });
  }
}

/** @group Errors */
export class MintingMustNotUseGroupError extends CandyMachineV3Error {
  constructor(options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'minting_must_not_use_group',
      title: 'Minting Must Not Use Group',
      problem:
        "You're trying to mint an NFT from a Candy Machine that has no groups of guards " +
        'yet you provided the label of a specific group to mint from.',
      solution:
        'Please set the `group` parameter to `null` or remove it altogether.',
    });
  }
}

/** @group Errors */
export class MintingGroupSelectedDoesNotExistError extends CandyMachineV3Error {
  constructor(
    providedGroup: string,
    availableGroups: string[],
    options?: MetaplexErrorOptions
  ) {
    super({
      options,
      key: 'minting_group_selected_does_not_exist',
      title: 'Minting Group Selected Does Not Exist',
      problem:
        `You're trying to mint an NFT from a Candy Machine using a specific group labelled [${providedGroup}] ` +
        'but this group of guards does not exists on the Candy Machine.',
      solution:
        'Please provide the label of a group that exists on the Candy Machine. ' +
        `The available groups are [${availableGroups.join(', ')}]`,
    });
  }
}

/** @group Errors */
export class GuardMitingSettingsMissingError extends CandyMachineV3Error {
  constructor(guardName: string, options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'guard_miting_settings_missing',
      title: 'Guard Miting Settings Missing',
      problem:
        `The Candy Machine you are trying to mint from has the [${guardName}] guard enabled. ` +
        'This guard requires you to provide some additional settings when minting which you did not provide.',
      solution:
        `Please provide some minting settings for the [${guardName}] guard ` +
        `via the \`guards\` parameter like so: \`guards.${guardName} = {...}\`.`,
    });
  }
}

/** @group Errors */
export class GatekeeperGuardRequiresExpireAccountError extends CandyMachineV3Error {
  constructor(options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'gatekeeper_guard_requires_expire_account',
      title: 'Gatekeeper Guard Requires Expire Account',
      problem:
        'The Candy Machine has the gatekeeper guard enabled with the `expireOnUse` ' +
        'option set to `true` but no `expireAccount` was providing when minting. ',
      solution:
        'Please provide the `expireAccount` parameter as part of the ' +
        'minting settings of the gatekeeper guard.',
    });
  }
}
