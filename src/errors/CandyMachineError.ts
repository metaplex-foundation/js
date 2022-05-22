import { bignum } from '@metaplex-foundation/beet';
import { ConfigLine } from '@metaplex-foundation/mpl-candy-machine';
import { PublicKey } from '@solana/web3.js';
import {
  MetaplexError,
  MetaplexErrorInputWithoutSource,
} from './MetaplexError';

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

export class CandyMachineNotFoundError extends CandyMachineError {
  constructor(candyMachineAddress: PublicKey, cause?: Error) {
    super({
      cause,
      key: 'candy_machine_not_found',
      title: 'CandyMachine Not Found',
      problem:
        'No account could be found for the provided candy machine address: ' +
        `[${candyMachineAddress.toBase58()}].`,
      solution:
        'Ensure the provided candy machine address is valid and that an associated ' +
        'Metadata account exists on the blockchain.',
    });
  }
}

export class CreatedCandyMachineNotFoundError extends CandyMachineError {
  constructor(candyMachineAddress: PublicKey, cause?: Error) {
    super({
      cause,
      key: 'created_candy_machine_not_found',
      title: 'Created CandyMachine Not Found',
      problem:
        'No account could be found for the candy machine that the client just created: ' +
        `[${candyMachineAddress.toBase58()}].`,
      solution:
        'Ensure that the candy machine could be created properly and without errors.' +
        'If the problem persists please file an issue.',
    });
  }
}

export class CandyMachineToUpdateNotFoundError extends CandyMachineError {
  constructor(candyMachineAddress: PublicKey, cause?: Error) {
    super({
      cause,
      key: 'candy_machine_to_update_not_found',
      title: 'CandyMachine to update Not Found',
      problem:
        'No account could be found for the candy machine that the client is trying to update: ' +
        `[${candyMachineAddress.toBase58()}].`,
      solution: 'Ensure that the candy machine exists at the provided address.',
    });
  }
}

export class UpdatedCandyMachineNotFoundError extends CandyMachineError {
  constructor(candyMachineAddress: PublicKey, cause?: Error) {
    super({
      cause,
      key: 'updated_candy_machine_not_found',
      title: 'Updated CandyMachine Not Found',
      problem:
        'No account could be found for the candy machine that the client just updated: ' +
        `[${candyMachineAddress.toBase58()}].`,
      solution:
        'Ensure that the candy machine could be updated properly and without errors.' +
        'If the problem persists please file an issue.',
    });
  }
}

export class CandyMachinesNotFoundByAuthorityError extends CandyMachineError {
  constructor(authorityAddress: PublicKey, cause?: Error) {
    super({
      cause,
      key: 'candy_machine_by_authority_not_found',
      title: 'CandyMachine By Authority Not Found',
      problem:
        'No candy machine account could be found for the authority: ' +
        `[${authorityAddress.toBase58()}].`,
      solution:
        'Ensure that you entered the correct authority and are connecting to the cluster where you created the candy machine.' +
        `Navigate to https://explorer.solana.com/address/${authorityAddress.toBase58()} find candy machines with the authority.`,
    });
  }
}

export class NoCandyMachineFoundForAuthorityMatchesUuidError extends CandyMachineError {
  constructor(
    authorityAddress: PublicKey,
    uuid: string,
    candyMachineAddresses: PublicKey[],
    cause?: Error
  ) {
    const addresses = candyMachineAddresses.map((address) =>
      address.toBase58()
    );
    super({
      cause,
      key: 'no_candy_machine_found_for_authority_matches_uuid',
      title: 'No Candy Machine Found for Authority Matches Uuid',
      problem:
        'None of the candy machines for the authority matched the provided uuid: ' +
        `[ uuid: ${uuid}, authority: ${authorityAddress.toBase58()}].`,
      solution:
        `Investigate which of the following candy machines is the correct one: [${addresses}]` +
        ` and correct the uuid accordingly.`,
    });
  }
}

export class MoreThanOneCandyMachineFoundByAuthorityAndUuidError extends CandyMachineError {
  constructor(
    authorityAddress: PublicKey,
    uuid: string,
    candyMachineAddresses: PublicKey[],
    cause?: Error
  ) {
    const addresses = candyMachineAddresses.map((address) =>
      address.toBase58()
    );
    super({
      cause,
      key: 'more_than_one_candy_machine_found_by_authority_and_uuid',
      title: 'More Than One Candy Machine Found By Authority And Uuid',
      problem:
        'More than one candy machine matched the provided uuid and authority: ' +
        `[${uuid} and ${authorityAddress.toBase58()}].`,
      solution:
        `Investigate which of the following candy machines is the correct one: [${addresses}]` +
        ` and load find them directly by CandyMachineAddress.`,
    });
  }
}

export class CandyMachineAlreadyHasThisAuthorityError extends CandyMachineError {
  constructor(authorityAddress: PublicKey, cause?: Error) {
    super({
      cause,
      key: 'candy_machine_already_has_this_authority',
      title: 'Candy Machine Already Has This Authority',
      problem:
        'The current authority of the candy machine is the same as the new authority provided: ' +
        `[${authorityAddress.toBase58()}].`,
      solution:
        'Double check the new authority you want to use for this Candy Machine.',
    });
  }
}

export class CandyMachineIsFullError extends CandyMachineError {
  constructor(index: number, maxSupply: bignum, cause?: Error) {
    const asset = index + 1;
    super({
      cause,
      key: 'candy_machine_is_full',
      title: 'Candy Machine Is Full',
      problem: `Trying to add asset number ${asset}, but candy machine only can hold ${maxSupply} assets.`,
      solution:
        'Limit number of assets you are adding or create a new Candy Machine that can hold more.',
    });
  }
}

export class CandyMachineCannotAddAmountError extends CandyMachineError {
  constructor(index: number, amount: number, maxSupply: bignum, cause?: Error) {
    super({
      cause,
      key: 'candy_machine_cannot_add_amount',
      title: 'Candy Machine Cannot Add Amount',
      problem: `Trying to add ${amount} assets to candy machine that already has ${index} assets and can only hold ${maxSupply} assets.`,
      solution:
        'Limit number of assets you are adding or create a new Candy Machine that can hold more.',
    });
  }
}

export class CandyMachineAddConfigConstraintsViolatedError extends CandyMachineError {
  constructor(index: number, configLine: ConfigLine, cause?: Error) {
    super({
      cause,
      key: 'candy_machine_add_config_constraints_violated',
      title: 'Candy Machine Add Config Constraints Violated',
      problem: `Trying to add an asset with name "${configLine.name}" and uri: "${configLine.uri}" to candy machine at index ${index} that violates constraints.`,
      solution: 'Fix the name or URI of this asset and try again.',
    });
  }
}
