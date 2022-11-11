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
export class GuardGroupRequiredError extends CandyMachineV3Error {
  constructor(availableGroups: string[], options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'guard_group_required',
      title: 'Guard Group Required',
      problem:
        'The provided Candy Machine defines groups of guards but no' +
        'group label was provided to identity which group we should select.',
      solution:
        'Please provide the label of the group you wish to select from via the `group` parameter. ' +
        `The available groups are [${availableGroups.join(', ')}]`,
    });
  }
}

/** @group Errors */
export class SelectedGuardGroupDoesNotExistError extends CandyMachineV3Error {
  constructor(
    selectedGroup: string,
    availableGroups: string[],
    options?: MetaplexErrorOptions
  ) {
    super({
      options,
      key: 'selected_guard_group_does_not_exist',
      title: 'Selected Guard Group Does Not Exist',
      problem:
        `You're trying to select the guard group [${selectedGroup}] from a ` +
        'Candy Machine but this group does not exists on this Candy Machine.',
      solution:
        availableGroups.length > 0
          ? 'Please provide the label of a group that exists on the Candy Machine. ' +
            `The available groups are [${availableGroups.join(', ')}]`
          : 'There are no guard groups defined on the Candy Machine. ' +
            'Please set the `group` parameter to `null` or remove it altogether.',
    });
  }
}

/** @group Errors */
export class GuardMintSettingsMissingError extends CandyMachineV3Error {
  constructor(guardName: string, options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'guard_mint_settings_missing',
      title: 'Guard Mint Settings Missing',
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
export class GuardRouteNotSupportedError extends CandyMachineV3Error {
  constructor(guardName: string, options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'guard_route_not_supported',
      title: 'Guard Route Not Supported',
      problem:
        `You are trying to call the route instruction of the [${guardName}] guard ` +
        'but this guard does not support this feature or did not register it on the SDK.',
      solution:
        'Please select a guard that support the route instruction feature. ' +
        'If you are using a custom guard, make sure you registered the route instruction ' +
        'feature by implementing the `routeSettingsParser` method on the guard manifest.',
    });
  }
}

/** @group Errors */
export class CandyGuardRequiredOnCandyMachineError extends CandyMachineV3Error {
  constructor(options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'candy_guard_required_on_candy_machine',
      title: 'Candy Guard Required On Candy Machine',
      problem:
        `The provided Candy Machine does not have a Candy Guard associated with ` +
        `it yet, it is required for the operation you are trying to execute.`,
      solution:
        'Please provide a Candy Machine with an associated Candy Guard account.',
    });
  }
}

/** @group Errors */
export class GuardNotEnabledError extends CandyMachineV3Error {
  constructor(
    guard: string,
    group: string | null,
    options?: MetaplexErrorOptions
  ) {
    super({
      options,
      key: 'guard_not_enabled',
      title: 'Guard Not Enabled',
      problem: group
        ? `The guard [${guard}] is not enabled on the group [${group}] of the Candy Machine.`
        : `The guard [${guard}] is not enabled on the Candy Machine.`,
      solution:
        'Please provide a different guard or select a different group ' +
        'such that the provided guard is enabled on the selected group.',
    });
  }
}

/** @group Errors */
export class GuardGroupLabelTooLongError extends CandyMachineV3Error {
  constructor(
    label: string,
    maxLength: number,
    options?: MetaplexErrorOptions
  ) {
    super({
      options,
      key: 'guard_group_label_too_long',
      title: 'Guard Group Label Too Long',
      problem:
        `The provided group label [${label}] is too long. ` +
        `Group labels cannot be longer than ${maxLength} characters.`,
      solution: 'Please provide a shorter group label.',
    });
  }
}

/** @group Errors */
export class UnrecognizePathForRouteInstructionError extends CandyMachineV3Error {
  constructor(guard: string, path: string, options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'unrecognize_path_for_route_instruction',
      title: 'Unrecognize Path For Route Instruction',
      problem: `The provided path [${path}] does not exist on the route instruction of the [${guard}] guard.`,
      solution: 'Please provide a recognized path.',
    });
  }
}

/** @group Errors */
export class MintOwnerMustBeMintPayerError extends CandyMachineV3Error {
  constructor(guard: string, options?: MetaplexErrorOptions) {
    super({
      options,
      key: 'mint_owner_must_be_mint_payer',
      title: 'Mint Owner Must Be Mint Payer',
      problem: `The payer must be the owner when using the [${guard}] guard.`,
      solution:
        'Please remove the `owner` attribute from the mint input so they can be the same.',
    });
  }
}
